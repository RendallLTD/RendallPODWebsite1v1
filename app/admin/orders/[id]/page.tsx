import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import OrderItemActions from "./OrderItemActions";

export const dynamic = "force-dynamic";

type OrderItem = {
  id: string;
  design_id: string | null;
  product_name: string;
  quantity: number;
  size: string | null;
  color: string | null;
  unit_price_cents: number;
  print_url_front: string | null;
  mockup_url_front: string | null;
  designs: { image_url: string | null; product_id: string } | { image_url: string | null; product_id: string }[] | null;
};

type Order = {
  id: string;
  user_id: string;
  status: string;
  total_cents: number;
  shipping_address: Record<string, string> | null;
  cart_item_ids: string[] | null;
  created_at: string;
  order_items: OrderItem[];
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id, user_id, status, total_cents, shipping_address, cart_item_ids, created_at, order_items(id, design_id, product_name, quantity, size, color, unit_price_cents, print_url_front, mockup_url_front, designs:design_id(image_url, product_id))")
    .eq("id", id)
    .single();

  if (error || !order) notFound();
  const o = order as Order;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/admin">← Back to all orders</Link>
      </div>
      <h2 style={{ marginBottom: 8 }}>Order {o.id.slice(0, 8)}</h2>
      <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>
        Status: <strong>{o.status}</strong> · Total ${(o.total_cents / 100).toFixed(2)} ·
        Created {new Date(o.created_at).toLocaleString()}
      </div>

      <section style={{ marginBottom: 32 }}>
        <h3>Shipping</h3>
        {o.shipping_address ? (
          <pre style={{ background: "var(--muted, #f5f5f5)", padding: 12, fontSize: 13, overflow: "auto" }}>
            {JSON.stringify(o.shipping_address, null, 2)}
          </pre>
        ) : <p style={{ opacity: 0.6 }}>No shipping address</p>}
      </section>

      <section>
        <h3>Items</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {o.order_items.map((item) => {
            const design = Array.isArray(item.designs) ? item.designs[0] : item.designs;
            return (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, padding: 12, border: "1px solid var(--border, #eee)", borderRadius: 8 }}>
                <div style={{ width: 120, height: 120, background: "var(--muted, #f5f5f5)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {design?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={design.image_url} alt="" style={{ maxWidth: "100%", maxHeight: "100%" }} />
                  ) : <span style={{ opacity: 0.5 }}>no design</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    Qty {item.quantity} · {item.size ?? "—"} · {item.color ?? "—"} · ${(item.unit_price_cents / 100).toFixed(2)} each
                  </div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>
                    <div>Print: {item.print_url_front ? <a href={item.print_url_front} target="_blank" rel="noreferrer">view</a> : <span style={{ opacity: 0.5 }}>not rendered</span>}</div>
                    <div>Mockup: {item.mockup_url_front ? <a href={item.mockup_url_front} target="_blank" rel="noreferrer">view</a> : <span style={{ opacity: 0.5 }}>not rendered</span>}</div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <OrderItemActions itemId={item.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <details style={{ marginTop: 32 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, opacity: 0.6 }}>Raw order JSON</summary>
        <pre style={{ background: "var(--muted, #f5f5f5)", padding: 12, fontSize: 12, overflow: "auto" }}>
          {JSON.stringify(o, null, 2)}
        </pre>
      </details>
    </div>
  );
}
