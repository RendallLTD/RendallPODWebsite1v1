"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  return (
    <section className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
        <h1>Order placed!</h1>
        <p className="auth-subtitle">
          Your order {orderId ? `#${orderId.slice(0, 8)}` : ""} has been received. We&apos;ll start printing soon.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
          <Link href="/dashboard/orders" className="btn btn--primary">View orders</Link>
          <Link href="/catalog" className="btn btn--outline">Continue shopping</Link>
        </div>
      </div>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
