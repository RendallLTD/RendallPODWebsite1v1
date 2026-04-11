import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }

  // Raw body — Stripe signature verification requires the bytes byte-for-byte.
  // Do NOT parse as JSON first.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await fulfillOrderFromSession(session);
    }
    // Any other event types: no-op. Return 200 so Stripe does not retry.
    return Response.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    // Non-2xx causes Stripe to retry delivery.
    return new Response("Webhook handler failed", { status: 500 });
  }
}

/**
 * Fulfill a draft order created by `/api/checkout/create-session`.
 *
 * The draft-order-first architecture (see plans/2026-04-11-stripe-codex-
 * findings-fix.md) means that by the time this webhook fires, the `orders`
 * row already exists in Supabase with status='pending' and full order_items
 * (design_id, size, color). This function's job is to:
 *   1. Flip status pending → paid (atomically, gated on status='pending')
 *   2. Delete only the snapshotted cart_items (NOT the whole user cart)
 *
 * Both steps are idempotent and always run on a retry, so a partial failure
 * on one delivery is fully reconciled on the next. This is the core defense
 * against Codex Finding 1 (retry recovery).
 */
async function fulfillOrderFromSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id as string | undefined;
  if (!orderId) {
    console.error(
      "[stripe webhook] checkout.session.completed missing metadata.order_id",
      { sessionId: session.id }
    );
    // Without order_id we cannot locate the draft. Do not retry.
    return;
  }

  const admin = createAdminClient();

  const { data: order, error: loadErr } = await admin
    .from("orders")
    .select("id, status, user_id, cart_item_ids")
    .eq("id", orderId)
    .single();

  if (loadErr || !order) {
    console.error("[stripe webhook] draft order not found", {
      orderId,
      sessionId: session.id,
      loadErr,
    });
    // Throwing triggers a Stripe retry. If the draft genuinely doesn't
    // exist (e.g. it was rolled back after a Stripe failure that somehow
    // still produced a completion event), Stripe will retry a few times
    // then give up — which is the right behavior.
    throw new Error(`Draft order ${orderId} not found`);
  }

  // In Stripe API version 2026-03-25.dahlia, the collected shipping address
  // lives at session.collected_information.shipping_details.
  const shippingAddress =
    session.collected_information?.shipping_details ?? null;

  // ---------- Step A: transition status pending → paid ----------
  // Only run if status is still 'pending'. The UPDATE's WHERE includes
  // status='pending' so two concurrent deliveries cannot both win — only
  // the first one changes the row (idempotent by construction).
  if (order.status === "pending") {
    const { error: updateErr } = await admin
      .from("orders")
      .update({
        status: "paid",
        stripe_session_id: session.id,
        shipping_address: shippingAddress,
        total_cents: session.amount_total ?? 0,
      })
      .eq("id", orderId)
      .eq("status", "pending");

    if (updateErr) {
      // 23505 on stripe_session_id (unique constraint from migration 003)
      // means another delivery raced us and won. Treat as idempotent
      // success — the winner has already done the work, but we still run
      // Step B below to be safe.
      if (updateErr.code !== "23505") {
        throw updateErr;
      }
      console.log(
        "[stripe webhook] concurrent delivery won the status race",
        { orderId, sessionId: session.id }
      );
    }
  } else {
    console.log("[stripe webhook] order already fulfilled (status)", {
      orderId,
      status: order.status,
      sessionId: session.id,
    });
  }

  // ---------- Step B: delete ONLY the snapshotted cart_items ----------
  // This always runs on every delivery, including retries. If cart cleanup
  // failed on a prior delivery, this is where it converges. The .in() on
  // an already-empty set is a harmless no-op, so running on a fully-
  // reconciled order costs nothing.
  //
  // The user_id filter is defense-in-depth — cart_item_ids were snapshotted
  // for this exact user, but filtering by both makes a cross-user leak
  // impossible.
  if (order.cart_item_ids && order.cart_item_ids.length > 0) {
    const { error: clearErr } = await admin
      .from("cart_items")
      .delete()
      .in("id", order.cart_item_ids)
      .eq("user_id", order.user_id);
    if (clearErr) {
      // Non-fatal for the order itself, but log loudly — user will see
      // stale cart items until they clear them manually. Do NOT throw:
      // an order that is paid but has stale cart leftovers is far less
      // bad than a paid order that keeps getting redelivered forever.
      console.error(
        "[stripe webhook] failed to clear cart snapshot",
        { orderId, sessionId: session.id, clearErr }
      );
    }
  }
}
