import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readWebhookHeaders, verifyWebhookSignature } from "@/lib/airwallex/webhook";
import { markOrderPaid } from "@/lib/orders/mark-paid";

export const runtime = "nodejs";

// Airwallex (and ngrok browser visits) may GET this URL to verify reachability
// before allowing the webhook to save. Respond 200 so endpoint validation
// passes; real event delivery is POST.
export async function GET() {
  return new Response("ok", { status: 200 });
}

type AirwallexEvent = {
  id?: string;
  name?: string;
  data?: {
    object?: {
      id?: string;
      status?: string;
      merchant_order_id?: string;
    };
  };
};

export async function POST(request: NextRequest) {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[airwallex webhook] AIRWALLEX_WEBHOOK_SECRET not configured");
    return new Response("not configured", { status: 500 });
  }

  // Read raw body before any parsing — signature is computed over bytes.
  const raw = await request.text();
  const headers = readWebhookHeaders(request.headers);

  if (!verifyWebhookSignature(raw, headers, secret)) {
    // 400 (not 401) tells Airwallex "don't retry, this is malformed" per their
    // retry policy. A forged request, a missing header, or a stale timestamp
    // all land here.
    return new Response("invalid signature", { status: 400 });
  }

  let event: AirwallexEvent;
  try {
    event = JSON.parse(raw) as AirwallexEvent;
  } catch {
    return new Response("malformed json", { status: 400 });
  }

  if (!event.id) {
    // No id = no idempotency key. Don't risk double-processing.
    return new Response("missing event id", { status: 400 });
  }

  const name = event.name ?? "";
  const intentId = event.data?.object?.id;
  const merchantOrderId = event.data?.object?.merchant_order_id;

  const admin = createAdminClient();

  // Idempotency: insert the event id; unique-violation = already seen.
  const { error: logErr } = await admin
    .from("airwallex_webhook_events")
    .insert({ event_id: event.id, name });
  if (logErr) {
    if (logErr.code === "23505") {
      return new Response("duplicate", { status: 200 });
    }
    // DB unavailable — let Airwallex retry rather than silently drop.
    console.error("[airwallex webhook] event log insert failed", {
      eventId: event.id,
      logErr,
    });
    return new Response("event log unavailable", { status: 503 });
  }

  // Event name strings follow Airwallex convention `payment_intent.succeeded`
  // etc. Double-check against the exact event catalog once sandbox webhooks
  // arrive — adjust the string match if they use a different form.
  if (name === "payment_intent.succeeded") {
    const orderId = await resolveOrderId({ intentId, merchantOrderId });
    if (!orderId) {
      console.warn("[airwallex webhook] succeeded event could not resolve order", {
        eventId: event.id,
        intentId,
        merchantOrderId,
      });
      return new Response("ok", { status: 200 });
    }
    const result = await markOrderPaid(orderId);
    if (!result.ok) {
      const transient = !result.status || result.status >= 500;
      console.error("[airwallex webhook] markOrderPaid failed", {
        eventId: event.id,
        orderId,
        reason: result.reason,
        transient,
      });
      if (transient) {
        // Roll back the event row so the retry can re-attempt cleanly.
        await admin.from("airwallex_webhook_events").delete().eq("event_id", event.id);
        return new Response("transient failure", { status: 503 });
      }
      // Terminal failure (order missing/wrong status) — ack so Airwallex stops.
      return new Response("terminal failure", { status: 200 });
    }
    // Forensic link from event back to the order it paid.
    await admin
      .from("airwallex_webhook_events")
      .update({ order_id: orderId })
      .eq("event_id", event.id);
    return new Response("ok", { status: 200 });
  }

  if (
    name === "payment_intent.cancelled" ||
    name === "payment_attempt.failed_to_process" ||
    name === "payment_attempt.expired"
  ) {
    console.warn("[airwallex webhook] payment did not complete", {
      eventId: event.id,
      name,
      intentId,
      merchantOrderId,
    });
    // No DB state change yet — `payment_failed` status is a future migration.
    return new Response("ok", { status: 200 });
  }

  // Unhandled event — acknowledge so Airwallex doesn't retry.
  return new Response("ok", { status: 200 });
}

async function resolveOrderId(params: {
  intentId?: string;
  merchantOrderId?: string;
}): Promise<string | null> {
  const admin = createAdminClient();
  if (params.intentId) {
    const { data } = await admin
      .from("orders")
      .select("id")
      .eq("airwallex_intent_id", params.intentId)
      .maybeSingle();
    if (data?.id) return data.id;
  }
  if (params.merchantOrderId) {
    // Fallback: webhook may arrive before our DB UPDATE persists the intent id.
    const { data } = await admin
      .from("orders")
      .select("id")
      .eq("id", params.merchantOrderId)
      .maybeSingle();
    if (data?.id) return data.id;
  }
  return null;
}
