"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderItemActions({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function rerender() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_item_ids: [itemId] }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(`Failed: ${json.error ?? res.statusText}`);
      else if (json.skipped?.length) setMsg(`Skipped: ${json.skipped[0].reason}`);
      else setMsg("Rendered.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <button className="btn btn--outline btn--sm" onClick={rerender} disabled={busy}>
        {busy ? "Rendering..." : "Re-render"}
      </button>
      {msg && <span style={{ fontSize: 12, opacity: 0.7 }}>{msg}</span>}
    </div>
  );
}
