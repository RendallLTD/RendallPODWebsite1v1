import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import OrderStatusPoller from "./OrderStatusPoller";

export default async function OrderPlacedPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/checkout/placed/${orderId}`);
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status, total_cents")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.user_id !== user!.id) {
    return (
      <section className="checkout-page">
        <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
          <h1>Order not found</h1>
          <p style={{ maxWidth: 560, margin: "16px auto", opacity: 0.8 }}>
            We couldn&apos;t find this order under your account.
          </p>
          <Link href="/dashboard/orders" className="btn btn--primary" style={{ marginTop: 24 }}>
            View my orders
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
        <OrderStatusPoller orderId={orderId} initialStatus={order.status} />
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
          <Link href="/dashboard/orders" className="btn btn--outline">View my orders</Link>
          <Link href="/catalog" className="btn btn--primary">Keep designing</Link>
        </div>
      </div>
    </section>
  );
}
