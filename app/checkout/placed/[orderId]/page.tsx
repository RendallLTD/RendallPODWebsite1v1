import Link from "next/link";

export default async function OrderPlacedPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <section className="checkout-page">
      <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
        <h1>Order placed</h1>
        <p style={{ maxWidth: 560, margin: "16px auto", opacity: 0.8 }}>
          Thanks — we&apos;ve got your order. Your reference is
          {" "}<code style={{ background: "var(--muted)", padding: "2px 6px", borderRadius: 4 }}>{orderId}</code>.
          We&apos;ll email you when production starts.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
          <Link href="/dashboard/orders" className="btn btn--outline">View my orders</Link>
          <Link href="/catalog" className="btn btn--primary">Keep designing</Link>
        </div>
      </div>
    </section>
  );
}
