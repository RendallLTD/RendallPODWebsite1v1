"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  allProducts,
  subcategories,
  getProductById,
  getProductHero,
  type Product,
} from "@/lib/products";
import { STEP_COLORS } from "@/lib/bulk-steps";

type Recipient = {
  cart_item_id: string;
  name: string;
  line1: string;
  city: string;
  state: string;
  postal: string;
  country: string;
  phone: string;
  size: string;
  color: string;
  quantity: number;
  reference: string;
};

function blankRecipient(cartItemId: string, defaultSize: string, defaultColor: string): Recipient {
  return {
    cart_item_id: cartItemId,
    name: "",
    line1: "",
    city: "",
    state: "",
    postal: "",
    country: "US",
    phone: "",
    size: defaultSize,
    color: defaultColor,
    quantity: 1,
    reference: "",
  };
}

export default function BulkStartPage() {
  // useSearchParams() must be inside a Suspense boundary on Next.js 16
  // for the static prerender to succeed.
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: "center", color: "#666" }}>Loading…</div>}>
      <BulkStartContent />
    </Suspense>
  );
}

function BulkStartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStep = Number(searchParams.get("step")) || 1;
  const returningDesignId = searchParams.get("designId");
  const returningProductId = searchParams.get("productId");
  const returningCartItemId = searchParams.get("cartItemId");
  const fromCart = searchParams.get("fromCart") === "1";

  const [step, setStep] = useState<number>(
    initialStep === 3 && (returningCartItemId || fromCart) ? 3 : 1,
  );
  const [product, setProduct] = useState<Product | null>(
    returningProductId ? getProductById(returningProductId) ?? null : null,
  );
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Designer-entry seeding: 3 blanks all bound to the just-created cart_item.
  useEffect(() => {
    if (step !== 3 || fromCart) return;
    if (!product || !returningCartItemId || recipients.length > 0) return;
    const defaultSize = product.sizes[Math.min(2, product.sizes.length - 1)] ?? product.sizes[0];
    const defaultColor = product.colors[0];
    setRecipients([
      blankRecipient(returningCartItemId, defaultSize, defaultColor),
      blankRecipient(returningCartItemId, defaultSize, defaultColor),
      blankRecipient(returningCartItemId, defaultSize, defaultColor),
    ]);
  }, [step, product, returningCartItemId, fromCart, recipients.length]);

  // Cart-entry seeding: load all of the user's cart_items, seed one
  // recipient per row carrying that row's id/size/color/qty. If the cart is
  // empty, bounce back to /cart.
  useEffect(() => {
    if (step !== 3 || !fromCart || recipients.length > 0) return;
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/bulk-start?step=3%26fromCart=1");
        return;
      }
      const { data: rows } = await supabase
        .from("cart_items")
        .select("id, quantity, size, color, design:designs(product_id)")
        .eq("user_id", user.id);
      const items = (rows as Array<{
        id: string;
        quantity: number;
        size: string;
        color: string;
        design: { product_id: string } | { product_id: string }[] | null;
      }>) ?? [];
      if (items.length === 0) {
        router.push("/cart");
        return;
      }
      // Display product = the first item's product (most carts are single-design).
      const firstDesign = Array.isArray(items[0].design) ? items[0].design[0] : items[0].design;
      const firstProduct = firstDesign ? getProductById(firstDesign.product_id) : null;
      if (firstProduct) setProduct(firstProduct);
      setRecipients(
        items.map((r) => ({
          ...blankRecipient(r.id, r.size, r.color),
          quantity: Math.max(1, r.quantity | 0),
        })),
      );
    })();
  }, [step, fromCart, recipients.length, router]);

  function selectProduct(p: Product) {
    router.push(`/design/${p.id}?bulkStart=1`);
  }

  function updateRecipient(idx: number, patch: Partial<Recipient>) {
    setRecipients((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRow() {
    if (!product || recipients.length === 0) return;
    // Clone from the first row — matches the bulk-checkout assumption that
    // additional ship-tos share the originating cart item (one design, many
    // ship-tos). For multi-design carts, the seller can change cart selection
    // via /cart before checkout.
    const source = recipients[0];
    const defaultSize = product.sizes[Math.min(2, product.sizes.length - 1)] ?? product.sizes[0];
    const defaultColor = product.colors[0];
    setRecipients((prev) => [
      ...prev,
      blankRecipient(source.cart_item_id, source.size || defaultSize, source.color || defaultColor),
    ]);
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = {
        recipients: recipients.map((r) => ({
          cart_item_id: r.cart_item_id,
          name: r.name.trim(),
          line1: r.line1.trim(),
          city: r.city.trim(),
          state: r.state.trim(),
          country: r.country,
          postal: r.postal.trim(),
          phone: r.phone.trim(),
          size: r.size,
          color: r.color,
          quantity: r.quantity,
          reference: r.reference.trim() || undefined,
        })),
      };
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json?.error ?? "Failed to create order.");
        return;
      }
      router.push(`/checkout/payment/${json.order_id}`);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function removeRow(idx: number) {
    setRecipients((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalShirts = recipients.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const tierPriceCents = useMemo(() => {
    if (!product) return 0;
    if (totalShirts >= 100) return Math.round(product.priceCents * 0.8);
    if (totalShirts >= 30) return Math.round(product.priceCents * 0.9);
    return product.priceCents;
  }, [product, totalShirts]);
  const subtotalCents = tierPriceCents * totalShirts;

  function fmt(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div style={{ background: "#fafafa", minHeight: "100vh", paddingBottom: 80 }}>
      <div className="container" style={{ paddingTop: 32 }}>
        <Stepper step={step} />

        {step === 1 && (
          <section>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Pick a blank</h1>
            <p style={{ color: "#666", marginBottom: 24 }}>
              Choose the product you want to print on. You&apos;ll design it in the next step.
            </p>

            {subcategories.map((sub) => {
              const products = allProducts.filter((p) => p.subcategory === sub);
              if (products.length === 0) return null;
              return (
                <div key={sub} style={{ marginBottom: 40 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#333" }}>
                    {sub}{" "}
                    <span style={{ color: "#999", fontWeight: 400, fontSize: 12 }}>
                      ({products.length})
                    </span>
                  </h2>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectProduct(p)}
                        style={{
                          background: "#fff",
                          border: "1px solid #e5e5e5",
                          borderRadius: 12,
                          padding: 12,
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "border-color 0.15s, transform 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = STEP_COLORS[0];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e5e5e5";
                        }}
                      >
                        <div
                          style={{
                            aspectRatio: "1",
                            background: "#f4f4f4",
                            borderRadius: 8,
                            overflow: "hidden",
                            marginBottom: 8,
                          }}
                        >
                          <img
                            src={getProductHero(p)}
                            alt={p.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                        <div style={{ fontSize: 12, color: "#999" }}>{p.brand}</div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4, lineHeight: 1.3 }}>
                          {p.name}
                        </div>
                        <div style={{ color: STEP_COLORS[0], fontWeight: 600, marginTop: 4, fontSize: 14 }}>
                          From {p.price}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {step === 3 && product && (
          <section>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Add recipients</h1>
            <p style={{ color: "#666", marginBottom: 24 }}>
              One row per shipment. Design: {product.name}.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {recipients.map((r, idx) => (
                <div key={idx} style={termCard}>
                  <span style={termBadge}>#{idx + 1}</span>
                  <button type="button" onClick={() => removeRow(idx)} style={termClose} aria-label="Remove">×</button>

                  <div style={termRow}>
                    <TermField label="Recipient" flex={2}>
                      <input style={termInput} value={r.name} placeholder="Jane Doe"
                        onChange={(e) => updateRecipient(idx, { name: e.target.value })} />
                    </TermField>
                    <TermField label="Phone" flex={1}>
                      <input style={termInput} value={r.phone} placeholder="+1 555 555 5555"
                        onChange={(e) => updateRecipient(idx, { phone: e.target.value })} />
                    </TermField>
                  </div>

                  <div style={termRow}>
                    <TermField label="Address" flex={1}>
                      <input style={termInput} value={r.line1} placeholder="123 Main St"
                        onChange={(e) => updateRecipient(idx, { line1: e.target.value })} />
                    </TermField>
                  </div>

                  <div style={termRow}>
                    <TermField label="City" flex={2}>
                      <input style={termInput} value={r.city} placeholder="Brooklyn"
                        onChange={(e) => updateRecipient(idx, { city: e.target.value })} />
                    </TermField>
                    <TermField label="State" flex={1}>
                      <input style={termInput} value={r.state} placeholder="NY"
                        onChange={(e) => updateRecipient(idx, { state: e.target.value })} />
                    </TermField>
                    <TermField label="Postal" flex={1}>
                      <input style={termInput} value={r.postal} placeholder="11201"
                        onChange={(e) => updateRecipient(idx, { postal: e.target.value })} />
                    </TermField>
                  </div>

                  <div style={termRow}>
                    <TermField label="Size" flex={1}>
                      <select style={termInput} value={r.size}
                        onChange={(e) => updateRecipient(idx, { size: e.target.value })}>
                        {product.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </TermField>
                    <TermField label="Color" flex={1}>
                      <select style={termInput} value={r.color}
                        onChange={(e) => updateRecipient(idx, { color: e.target.value })}>
                        {product.colors.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </TermField>
                    <TermField label="Qty" flex={1}>
                      <input type="number" min={1} style={termInput} value={r.quantity}
                        onChange={(e) => updateRecipient(idx, { quantity: Number(e.target.value) || 1 })} />
                    </TermField>
                    <TermField label="Ref #" flex={1}>
                      <input style={termInput} value={r.reference} placeholder="ETSY-1234"
                        onChange={(e) => updateRecipient(idx, { reference: e.target.value })} />
                    </TermField>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addRow} style={termAddBtn}>
                [+ Add recipient]
              </button>
            </div>

            <div
              style={{
                marginTop: 16,
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "#999" }}>
                  {totalShirts} shirt{totalShirts === 1 ? "" : "s"} @ {fmt(tierPriceCents)} each
                  {tierPriceCents < product.priceCents && (
                    <span style={{ marginLeft: 8, color: "#16a34a", fontWeight: 600 }}>
                      Volume discount applied
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{fmt(subtotalCents)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                {submitError && (
                  <div style={{ color: "#c0392b", fontSize: 13, maxWidth: 360, textAlign: "right" }}>
                    {submitError}
                  </div>
                )}
                <div style={{ display: "flex", gap: 12 }}>
                  {!fromCart && returningDesignId && (
                    <button
                      type="button"
                      onClick={() => router.push(`/design/${product.id}?bulkStart=1&designId=${returningDesignId}`)}
                      className="btn"
                    >
                      ← Edit design
                    </button>
                  )}
                  {fromCart && (
                    <button
                      type="button"
                      onClick={() => router.push("/cart")}
                      className="btn"
                    >
                      ← Back to cart
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || recipients.length === 0}
                    className="btn btn--primary"
                    style={{ background: STEP_COLORS[2], borderColor: STEP_COLORS[2] }}
                  >
                    {submitting ? "Submitting…" : "Continue to payment →"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Pick a blank", "Design", "Add recipients"];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
      {labels.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        const stepColor = STEP_COLORS[i];
        return (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: active ? stepColor : done ? stepColor : "#fff",
              opacity: done ? 0.55 : 1,
              color: active || done ? "#fff" : "#666",
              border: active || done ? "none" : "1px solid #e5e5e5",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: active || done ? "rgba(255,255,255,0.25)" : "#f0f0f0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
              }}
            >
              {done ? "✓" : n}
            </span>
            {label}
          </div>
        );
      })}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "16px 8px 12px",
  fontWeight: 600,
  fontSize: 12,
  color: "#999",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
const td: React.CSSProperties = { padding: "6px 8px", verticalAlign: "middle" };
const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  fontSize: 14,
  background: "#f1f1f1",
  color: "inherit",
  fontFamily: "inherit",
  outline: "none",
};

// ─── Terminal aesthetic — recipient cards ─────────────────────────────────
const TERM_FONT = '"Hack", "SF Mono", "Monaco", "Menlo", "Consolas", monospace';

const termCard: React.CSSProperties = {
  position: "relative",
  background: "#fff",
  border: "1px solid #1a1a1a",
  borderRadius: 4,
  padding: "20px 16px 12px",
  fontFamily: TERM_FONT,
  fontSize: 13,
  color: "#1a1a1a",
};

const termBadge: React.CSSProperties = {
  position: "absolute",
  top: -8,
  left: 12,
  background: "#fff",
  padding: "0 8px",
  color: "#1a1a1a",
  fontSize: 11,
  fontFamily: TERM_FONT,
};

const termClose: React.CSSProperties = {
  position: "absolute",
  top: -10,
  right: 12,
  background: "#fff",
  padding: "0 8px",
  color: "#1a1a1a",
  fontSize: 16,
  border: "none",
  cursor: "pointer",
  fontFamily: TERM_FONT,
  lineHeight: 1,
};

const termRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 8,
};

const termInput: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#1a1a1a",
  fontFamily: TERM_FONT,
  fontSize: 13,
  padding: "2px 0",
  flex: 1,
  minWidth: 0,
  width: "100%",
  outline: "none",
};

const termAddBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px dashed #1a1a1a",
  borderRadius: 4,
  padding: "16px 12px",
  color: "#1a1a1a",
  fontFamily: TERM_FONT,
  fontSize: 13,
  cursor: "pointer",
  textAlign: "center",
};

function TermField({ label, flex, children }: { label: string; flex: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flex }}>
      <span style={{ color: "#666", fontSize: 12, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: "#bbb", flexShrink: 0 }}>[</span>
      <span style={{ flex: 1, minWidth: 0, display: "flex" }}>{children}</span>
      <span style={{ color: "#bbb", flexShrink: 0 }}>]</span>
    </div>
  );
}
