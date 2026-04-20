"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderRow = {
  id: string;
  user_id: string;
  status: string;
  total_cents: number;
  shipping_address: { city?: string; country?: string } | null;
  created_at: string;
  order_items: { id: string; print_url_front: string | null; mockup_url_front: string | null }[];
};

export default function AdminOrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function markPaid(orderId: string) {
    setBusy(`paid:${orderId}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-paid`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setMessage(`Mark paid failed: ${json.reason || json.error || "unknown"}`);
      } else {
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function renderSelected() {
    if (selected.size === 0) return;
    setBusy("render");
    setMessage(null);
    try {
      const itemIds = orders
        .filter((o) => selected.has(o.id))
        .flatMap((o) => o.order_items.map((i) => i.id));
      const res = await fetch("/api/admin/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_item_ids: itemIds }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(`Render failed: ${json.error || "unknown"}`);
      } else {
        setMessage(`Rendered ${json.rendered?.length ?? 0}, skipped ${json.skipped?.length ?? 0}.`);
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function exportXlsx() {
    if (selected.size === 0) return;
    setBusy("export");
    setMessage(null);
    try {
      const orderIds = Array.from(selected);
      const res = await fetch("/api/admin/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_ids: orderIds }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setMessage(`Export failed: ${json.error || res.statusText}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rendall-factory-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          className="btn btn--outline"
          disabled={selected.size === 0 || busy !== null}
          onClick={renderSelected}
        >
          {busy === "render" ? "Rendering..." : `Generate renders (${selected.size})`}
        </button>
        <button
          className="btn btn--primary"
          disabled={selected.size === 0 || busy !== null}
          onClick={exportXlsx}
        >
          {busy === "export" ? "Exporting..." : `Export XLSX (${selected.size})`}
        </button>
      </div>
      {message && <p style={{ marginBottom: 12 }}>{message}</p>}
      <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border, #ddd)" }}>
            <th style={{ padding: 8 }}></th>
            <th style={{ padding: 8 }}>Created</th>
            <th style={{ padding: 8 }}>Order</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Items</th>
            <th style={{ padding: 8 }}>Rendered</th>
            <th style={{ padding: 8 }}>Total</th>
            <th style={{ padding: 8 }}>Ship to</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", opacity: 0.6 }}>No orders yet.</td></tr>
          )}
          {orders.map((o) => {
            const total = o.order_items.length;
            const rendered = o.order_items.filter((i) => i.print_url_front && i.mockup_url_front).length;
            const dest = [o.shipping_address?.city, o.shipping_address?.country].filter(Boolean).join(", ") || "—";
            return (
              <tr key={o.id} style={{ borderBottom: "1px solid var(--border, #eee)" }}>
                <td style={{ padding: 8 }}>
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggle(o.id)}
                  />
                </td>
                <td style={{ padding: 8 }}>{new Date(o.created_at).toLocaleString()}</td>
                <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>
                  <Link href={`/admin/orders/${o.id}`}>{o.id.slice(0, 8)}</Link>
                </td>
                <td style={{ padding: 8 }}>{o.status}</td>
                <td style={{ padding: 8 }}>{total}</td>
                <td style={{ padding: 8 }}>{rendered}/{total}</td>
                <td style={{ padding: 8 }}>${(o.total_cents / 100).toFixed(2)}</td>
                <td style={{ padding: 8 }}>{dest}</td>
                <td style={{ padding: 8 }}>
                  {o.status === "pending" && (
                    <button
                      className="btn btn--outline btn--sm"
                      disabled={busy !== null}
                      onClick={() => markPaid(o.id)}
                    >
                      {busy === `paid:${o.id}` ? "…" : "Mark paid"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
