"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const AirwallexDropIn = dynamic(
  () => import("@/components/checkout/AirwallexDropIn"),
  { ssr: false, loading: () => <p style={{ opacity: 0.7 }}>Loading secure checkout…</p> },
);

type Intent = {
  intent_id: string;
  client_secret: string;
  amount: number;
  currency: string;
};

export default function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      const { orderId: id } = await params;
      setOrderId(id);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=/checkout/payment/${id}`);
        return;
      }

      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: id }),
      });
      const json = await res.json().catch(() => null);

      if (res.status === 409) {
        router.push(`/checkout/placed/${id}`);
        return;
      }
      if (!res.ok || !json?.intent_id) {
        setError(json?.error ?? "Could not start payment. Please try again.");
        return;
      }
      setIntent(json as Intent);
    })();
  }, [params, router]);

  const handleSuccess = useCallback(() => {
    if (!orderId) return;
    setPaying(true);
    router.push(`/checkout/placed/${orderId}`);
  }, [orderId, router]);

  const handleError = useCallback((err: unknown) => {
    console.error("[checkout/payment] Drop-in error", err);
    setError("Payment didn't go through. Check your card details and try again.");
  }, []);

  return (
    <section className="checkout-page">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1>Payment</h1>
        <p style={{ opacity: 0.75, marginBottom: 24 }}>
          Pay securely to complete your order. We&apos;ll email you as soon as
          production starts.
        </p>

        {intent && (
          <div className="checkout-summary" style={{ marginBottom: 24 }}>
            <div className="checkout-summary__total">
              <span>Total due</span>
              <span>
                {intent.currency} ${(intent.amount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: "crimson", marginBottom: 16 }}>{error}</p>
        )}

        {!intent && !error && (
          <p style={{ opacity: 0.7 }}>Preparing secure checkout…</p>
        )}

        {intent && !paying && (
          <AirwallexDropIn
            intentId={intent.intent_id}
            clientSecret={intent.client_secret}
            amount={intent.amount}
            currency={intent.currency}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}

        {paying && <p>Confirming your payment…</p>}

        <div style={{ marginTop: 32 }}>
          <Link href="/bulk-start?step=3&fromCart=1" className="btn btn--outline">Back to checkout</Link>
        </div>
      </div>
    </section>
  );
}
