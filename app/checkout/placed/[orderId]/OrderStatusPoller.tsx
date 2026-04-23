"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Status = "pending" | "paid" | "payment_failed" | string;

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15;

export default function OrderStatusPoller({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    if (status !== "pending") return;
    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { status?: Status };
          if (!cancelled && json.status && json.status !== "pending") {
            setStatus(json.status);
            return;
          }
        }
      } catch {
        // swallow — keep polling
      }
      if (attempts >= MAX_ATTEMPTS) {
        if (!cancelled) setExhausted(true);
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    };

    const t = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [orderId, status]);

  if (status === "paid") {
    return (
      <>
        <h1>Order confirmed</h1>
        <p style={{ maxWidth: 560, margin: "16px auto", opacity: 0.8 }}>
          Thanks — payment went through. We&apos;ll email you when production
          starts. Your reference is{" "}
          <code style={{ background: "var(--muted)", padding: "2px 6px", borderRadius: 4 }}>
            {orderId}
          </code>
          .
        </p>
      </>
    );
  }

  if (status === "payment_failed") {
    return (
      <>
        <h1>Payment didn&apos;t complete</h1>
        <p style={{ maxWidth: 560, margin: "16px auto", opacity: 0.8 }}>
          We couldn&apos;t confirm your payment. You can try again — your order
          is still reserved.
        </p>
        <Link
          href={`/checkout/payment/${orderId}`}
          className="btn btn--primary"
          style={{ marginTop: 24 }}
        >
          Try payment again
        </Link>
      </>
    );
  }

  // pending
  return (
    <>
      <h1>{exhausted ? "Still confirming…" : "Confirming your payment…"}</h1>
      <p style={{ maxWidth: 560, margin: "16px auto", opacity: 0.8 }}>
        {exhausted
          ? "This is taking longer than usual. You'll get an email as soon as it goes through — no need to wait on this page."
          : "Hold tight — we're waiting for confirmation from the payment processor."}
        {" "}Your reference is{" "}
        <code style={{ background: "var(--muted)", padding: "2px 6px", borderRadius: 4 }}>
          {orderId}
        </code>
        .
      </p>
    </>
  );
}
