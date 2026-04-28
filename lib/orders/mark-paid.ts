import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueRenderJobs } from "@/lib/render/queue";

type Result =
  | { ok: true; alreadyPaid?: boolean }
  | { ok: false; reason: string; status?: number };

// Flip a pending order to paid + clear snapshotted cart items. Shared by the
// admin manual-override route and the Airwallex webhook. Idempotent: a
// re-invocation on an already-paid order returns `{ ok: true, alreadyPaid: true }`.
export async function markOrderPaid(orderId: string): Promise<Result> {
  const admin = createAdminClient();

  const { data: order, error: loadErr } = await admin
    .from("orders")
    .select("id, status, user_id, cart_item_ids")
    .eq("id", orderId)
    .single();

  if (loadErr || !order) {
    return { ok: false, reason: "order not found", status: 404 };
  }
  if (order.status === "paid") {
    return { ok: true, alreadyPaid: true };
  }
  if (order.status !== "pending") {
    return { ok: false, reason: `order is ${order.status}`, status: 409 };
  }

  // Conditional UPDATE so two concurrent callers can't both run cart cleanup —
  // only the caller that flipped pending→paid proceeds to clear items.
  const { data: updated, error: updateErr } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id");
  if (updateErr) {
    return { ok: false, reason: updateErr.message, status: 500 };
  }
  if (!updated || updated.length === 0) {
    // Someone else won the race — still a success from our caller's POV.
    return { ok: true, alreadyPaid: true };
  }

  if (order.cart_item_ids && order.cart_item_ids.length > 0) {
    const { error: clearErr } = await admin
      .from("cart_items")
      .delete()
      .in("id", order.cart_item_ids)
      .eq("user_id", order.user_id);
    if (clearErr) {
      // Don't fail the mark-paid on a cart cleanup error — log and continue.
      console.error("[mark-paid] cart cleanup failed", { orderId, clearErr });
    }
  }

  // Enqueue a durable render job per order_item. Insert is fast and
  // synchronous; the actual sharp+upload work runs from the admin worker
  // route. Failed enqueue does NOT fail mark-paid — admin can re-trigger
  // render from the order detail page and a job row will be created then.
  const enq = await enqueueRenderJobs(orderId);
  if (!enq.ok) {
    console.error("[mark-paid] render enqueue failed", { orderId, error: enq.error });
  }

  return { ok: true };
}
