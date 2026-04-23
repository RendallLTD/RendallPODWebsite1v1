import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforce, getClientIp, limiters } from "@/lib/ratelimit";
import { createPaymentIntent, getPaymentIntent } from "@/lib/airwallex/payment-intents";
import { markOrderPaid } from "@/lib/orders/mark-paid";

export const runtime = "nodejs";

type Body = { order_id?: unknown };

export async function POST(request: NextRequest) {
  const limited = await enforce(limiters.api, `create-intent:${getClientIp(request)}`);
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const orderId = typeof body?.order_id === "string" ? body.order_id : null;
  if (!orderId) {
    return Response.json({ error: "order_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order, error: loadErr } = await admin
    .from("orders")
    .select("id, user_id, status, total_cents, airwallex_intent_id")
    .eq("id", orderId)
    .single();

  if (loadErr || !order) {
    return Response.json({ error: "order not found" }, { status: 404 });
  }
  if (order.user_id !== user.id) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  if (order.status !== "pending") {
    return Response.json({ error: `order already ${order.status}` }, { status: 409 });
  }
  if (!order.total_cents || order.total_cents <= 0) {
    return Response.json({ error: "invalid order total" }, { status: 500 });
  }

  // Reuse an existing intent if one was already created for this order.
  if (order.airwallex_intent_id) {
    try {
      const existing = await getPaymentIntent(order.airwallex_intent_id);
      if (existing.status === "SUCCEEDED") {
        // Airwallex says it's paid; reconcile the DB and tell the client.
        await markOrderPaid(order.id);
        return Response.json({ error: "order already paid" }, { status: 409 });
      }
      return Response.json({
        intent_id: existing.id,
        client_secret: existing.client_secret,
        amount: order.total_cents,
        currency: existing.currency,
      });
    } catch (err) {
      console.error("[create-intent] failed to fetch existing intent", {
        orderId: order.id,
        intentId: order.airwallex_intent_id,
        err: err instanceof Error ? err.message : String(err),
      });
      // Fall through and create a new one rather than wedge the customer.
    }
  }

  let intent;
  try {
    intent = await createPaymentIntent({
      amount: order.total_cents,
      currency: "USD",
      merchantOrderId: order.id,
      requestId: randomUUID(),
    });
  } catch (err) {
    console.error("[create-intent] Airwallex createPaymentIntent failed", {
      orderId: order.id,
      err: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "payment provider unavailable" }, { status: 502 });
  }

  // Conditional UPDATE: if another concurrent call already wrote an intent id,
  // we lose the race — re-read and return the winning intent instead of
  // clobbering it.
  const { data: winner } = await admin
    .from("orders")
    .update({ airwallex_intent_id: intent.id })
    .eq("id", order.id)
    .is("airwallex_intent_id", null)
    .select("id, airwallex_intent_id");

  if (!winner || winner.length === 0) {
    const { data: fresh } = await admin
      .from("orders")
      .select("airwallex_intent_id")
      .eq("id", order.id)
      .single();
    if (fresh?.airwallex_intent_id && fresh.airwallex_intent_id !== intent.id) {
      try {
        const existing = await getPaymentIntent(fresh.airwallex_intent_id);
        return Response.json({
          intent_id: existing.id,
          client_secret: existing.client_secret,
          amount: order.total_cents,
          currency: existing.currency,
        });
      } catch (err) {
        console.error("[create-intent] race re-read failed", { orderId: order.id, err });
      }
    }
  }

  return Response.json({
    intent_id: intent.id,
    client_secret: intent.client_secret,
    amount: order.total_cents,
    currency: intent.currency,
  });
}
