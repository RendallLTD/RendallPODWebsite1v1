import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: order, error: loadErr } = await admin
    .from("orders")
    .select("id, status, user_id, cart_item_ids")
    .eq("id", id)
    .single();

  if (loadErr || !order) {
    return Response.json({ ok: false, reason: "order not found" }, { status: 404 });
  }
  if (order.status !== "pending") {
    return Response.json({ ok: false, reason: `order is ${order.status}` });
  }

  // Gate the UPDATE on status='pending' so two concurrent admin clicks can't
  // both run cart cleanup — only the first wins. Idempotent by construction.
  const { error: updateErr } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", id)
    .eq("status", "pending");
  if (updateErr) {
    return Response.json({ ok: false, reason: updateErr.message }, { status: 500 });
  }

  if (order.cart_item_ids && order.cart_item_ids.length > 0) {
    const { error: clearErr } = await admin
      .from("cart_items")
      .delete()
      .in("id", order.cart_item_ids)
      .eq("user_id", order.user_id);
    if (clearErr) {
      // Don't fail the mark-paid on a cart cleanup error — log and continue.
      console.error("[admin mark-paid] cart cleanup failed", { orderId: id, clearErr });
    }
  }

  return Response.json({ ok: true, status: "paid" });
}
