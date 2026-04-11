"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  // Stripe redirects with ?session_id={CHECKOUT_SESSION_ID}. We do NOT query
  // Supabase for the order here — the webhook is async and the order row may
  // not exist yet. The dashboard orders page will show it once the webhook
  // lands (usually within a couple of seconds). The session_id is logged for
  // support/debugging but not shown in the UI.
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      console.log("[checkout] success for session", sessionId);
    }
  }, [searchParams]);

  return (
    <section className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
        <h1>Payment received</h1>
        <p className="auth-subtitle">
          Thanks — we&apos;ve received your payment. Your order confirmation
          will arrive in your inbox shortly, and you can track its status
          from your dashboard.
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
