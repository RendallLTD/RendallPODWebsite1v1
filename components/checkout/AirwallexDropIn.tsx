"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  intentId: string;
  clientSecret: string;
  amount: number; // cents
  currency: string;
  onSuccess: (intentId: string) => void;
  onError: (err: unknown) => void;
};

export default function AirwallexDropIn({
  intentId,
  clientSecret,
  amount,
  currency,
  onSuccess,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    // Stash the mounted element so we can destroy it on unmount.
    let element: { destroy?: () => void } | null = null;

    (async () => {
      try {
        const sdk = await import("@airwallex/components-sdk");
        const env = (process.env.NEXT_PUBLIC_AIRWALLEX_ENV as "demo" | "prod") ?? "demo";
        // init is idempotent but we call it once per mount — cheap and safe.
        await sdk.init({ env, enabledElements: ["payments"] });

        if (cancelled || !containerRef.current) return;

        const dropInOptions = {
          intent_id: intentId,
          client_secret: clientSecret,
          currency,
          amount: { value: amount / 100, currency },
          layout: { type: "accordion" },
          appearance: {
            mode: "light",
            variables: { colorBrand: "#111111" },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        // SDK's createElement has a generic union of element-option types; pass
        // through as `any` since we narrow by element name at call-time.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        element = await (sdk.createElement as any)("dropIn", dropInOptions);

        if (cancelled || !element) return;

        // Typed loosely — SDK event shapes vary by version; we treat
        // success/error as opaque and rely on our own intent id for
        // correlation.
        const el = element as unknown as {
          mount: (target: HTMLElement) => void;
          on: (event: string, handler: (e: unknown) => void) => void;
          destroy?: () => void;
        };
        el.mount(containerRef.current);
        el.on("ready", () => {
          if (!cancelled) setStatus("ready");
        });
        el.on("success", () => {
          if (!cancelled) onSuccess(intentId);
        });
        el.on("error", (e) => {
          if (!cancelled) {
            setStatus("error");
            onError(e);
          }
        });
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          onError(err);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        element?.destroy?.();
      } catch {
        // ignore — unmount cleanup is best-effort
      }
    };
  }, [intentId, clientSecret, amount, currency, onSuccess, onError]);

  return (
    <div>
      {status === "loading" && (
        <p style={{ opacity: 0.7, marginBottom: 12 }}>Loading secure checkout…</p>
      )}
      <div ref={containerRef} style={{ minHeight: 400 }} />
    </div>
  );
}
