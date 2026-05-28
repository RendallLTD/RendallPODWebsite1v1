import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import OrderItemActions from "./OrderItemActions";

export const dynamic = "force-dynamic";

type RenderJob = {
  status: "pending" | "running" | "done" | "failed";
  attempts: number;
  last_error: string | null;
};

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
  print_url_back: string | null;
  mockup_url_back: string | null;
  recipient_address: Record<string, string> | null;
  designs: { image_url: string | null; product_id: string } | { image_url: string | null; product_id: string }[] | null;
  render_jobs: RenderJob | RenderJob[] | null;
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
    .select("id, user_id, status, total_cents, shipping_address, cart_item_ids, created_at, order_items(id, design_id, product_name, quantity, size, color, unit_price_cents, print_url_front, mockup_url_front, print_url_back, mockup_url_back, recipient_address, designs:design_id(image_url, product_id), render_jobs(status, attempts, last_error))")
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
        <h3>Shipping (primary contact)</h3>
        {o.shipping_address ? (
          <pre style={{ background: "var(--muted, #f5f5f5)", padding: 12, fontSize: 13, overflow: "auto" }}>
            {JSON.stringify(o.shipping_address, null, 2)}
          </pre>
        ) : <p style={{ opacity: 0.6 }}>No shipping address</p>}
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
          Per-recipient addresses are listed on each item below.
        </p>
      </section>

      <section>
        <h3>Items</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {o.order_items.map((item) => {
            const design = Array.isArray(item.designs) ? item.designs[0] : item.designs;
            const job = Array.isArray(item.render_jobs) ? item.render_jobs[0] : item.render_jobs;
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
                  {item.recipient_address && (
                    <div style={{ fontSize: 12, marginTop: 6, padding: 8, background: "var(--muted, #fafafa)", borderRadius: 4 }}>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>Ship to</div>
                      <div>{item.recipient_address.name}</div>
                      <div>{item.recipient_address.line1}</div>
                      <div>{item.recipient_address.city}, {item.recipient_address.state} {item.recipient_address.postal}</div>
                      <div>{item.recipient_address.country} · {item.recipient_address.phone}</div>
                    </div>
                  )}
                  {job && (
                    <div style={{ fontSize: 12, marginTop: 6 }}>
                      Render: <strong style={{ color: job.status === "failed" ? "#c0392b" : job.status === "done" ? "#27ae60" : undefined }}>{job.status}</strong>
                      {job.attempts > 0 && <> · attempts {job.attempts}</>}
                      {job.status === "failed" && job.last_error && (
                        <div style={{ marginTop: 4, color: "#c0392b" }}>Last error: {job.last_error}</div>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 13, marginTop: 8 }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>Front</div>
                    <div>Print: {item.print_url_front ? <a href={`/api/admin/render-asset?item=${item.id}&kind=print&side=front`} target="_blank" rel="noreferrer">view</a> : <span style={{ opacity: 0.5 }}>not rendered</span>}</div>
                    <div>Mockup: {item.mockup_url_front ? <a href={`/api/admin/render-asset?item=${item.id}&kind=mockup&side=front`} target="_blank" rel="noreferrer">view</a> : <span style={{ opacity: 0.5 }}>not rendered</span>}</div>
                    <div style={{ fontWeight: 500, marginTop: 6, marginBottom: 2 }}>Back</div>
                    <div>Print: {item.print_url_back ? <a href={`/api/admin/render-asset?item=${item.id}&kind=print&side=back`} target="_blank" rel="noreferrer">view</a> : <span style={{ opacity: 0.5 }}>not rendered</span>}</div>
                    <div>Mockup: {item.mockup_url_back ? <a href={`/api/admin/render-asset?item=${item.id}&kind=mockup&side=back`} target="_blank" rel="noreferrer">view</a> : <span style={{ opacity: 0.5 }}>not rendered</span>}</div>
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
