"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  allProducts,
  subcategories,
  getProductById,
  getProductHero,
  getDesignerPhoto,
  type Product,
  type PrintAreaSpec,
} from "@/lib/products";
import { STEP_COLORS } from "@/lib/bulk-steps";

type LayerPos = {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
};

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
  // Legacy: single preview, used as fallback when per-side urls are missing
  // (designs created before migration 019).
  design_image_url?: string;
  design_image_url_front?: string;
  design_image_url_back?: string;
  // First layer's mm geometry per side — used to position the thumbnail
  // overlay so it matches the renderer's placement, not a hardcoded chest.
  front_layer?: LayerPos;
  back_layer?: LayerPos;
  product_id?: string;
};

// Maps a layer's mm position into CSS % coordinates on the shirt-photo tile.
// Mirrors lib/render/mockup.ts so the bulk-start preview matches the eventual
// factory render: print-area rectangle is overlay.{left,top,width,height} as
// fractions of the photo, and within it a layer at (xMm, yMm) is offset from
// the rectangle's center by xMm/yMm scaled to print-area px-per-mm.
function computeOverlayStyle(
  spec: PrintAreaSpec | undefined,
  layer: LayerPos | undefined,
): React.CSSProperties | undefined {
  if (!spec || !layer) return undefined;
  const { overlay } = spec;
  // Layer dimensions as a fraction of the photo.
  const widthPct = overlay.width * (layer.widthMm / spec.widthMm) * 100;
  const heightPct = overlay.height * (layer.heightMm / spec.heightMm) * 100;
  // Layer center on the photo (fractions of full photo width/height).
  const centerXPct = (overlay.left + overlay.width / 2 + (layer.xMm / spec.widthMm) * overlay.width) * 100;
  const centerYPct = (overlay.top + overlay.height / 2 + (layer.yMm / spec.heightMm) * overlay.height) * 100;
  return {
    position: "absolute",
    left: `${centerXPct - widthPct / 2}%`,
    top: `${centerYPct - heightPct / 2}%`,
    width: `${widthPct}%`,
    height: `${heightPct}%`,
    objectFit: "fill",
    pointerEvents: "none",
  };
}

function firstLayerPos(designConfig: unknown, side: string): LayerPos | undefined {
  if (!designConfig || typeof designConfig !== "object") return undefined;
  const sides = (designConfig as { sides?: Record<string, unknown> }).sides;
  if (!sides) return undefined;
  const layers = sides[side];
  if (!Array.isArray(layers) || layers.length === 0) return undefined;
  const l = layers[0] as Partial<LayerPos>;
  if (
    typeof l.xMm !== "number" ||
    typeof l.yMm !== "number" ||
    typeof l.widthMm !== "number" ||
    typeof l.heightMm !== "number"
  ) {
    return undefined;
  }
  return { xMm: l.xMm, yMm: l.yMm, widthMm: l.widthMm, heightMm: l.heightMm };
}

function blankRecipient(
  cartItemId: string,
  defaultSize: string,
  defaultColor: string,
  extras?: {
    designImageUrl?: string;
    designImageUrlFront?: string;
    designImageUrlBack?: string;
    frontLayer?: LayerPos;
    backLayer?: LayerPos;
    productId?: string;
  },
): Recipient {
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
    design_image_url: extras?.designImageUrl,
    design_image_url_front: extras?.designImageUrlFront,
    design_image_url_back: extras?.designImageUrlBack,
    front_layer: extras?.frontLayer,
    back_layer: extras?.backLayer,
    product_id: extras?.productId,
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
  // Also fetch the design's image_url once so recipient rows can render a
  // thumbnail without an extra query per row.
  useEffect(() => {
    if (step !== 3 || fromCart) return;
    if (!product || !returningCartItemId || recipients.length > 0) return;
    const defaultSize = product.sizes[Math.min(2, product.sizes.length - 1)] ?? product.sizes[0];
    const defaultColor = product.colors[0];
    (async () => {
      let designImageUrl: string | undefined;
      let designImageUrlFront: string | undefined;
      let designImageUrlBack: string | undefined;
      let frontLayer: LayerPos | undefined;
      let backLayer: LayerPos | undefined;
      if (returningDesignId) {
        const supabase = createClient();
        const { data: design } = await supabase
          .from("designs")
          .select("image_url, image_url_front, image_url_back, design_config")
          .eq("id", returningDesignId)
          .single();
        const d = design as {
          image_url: string | null;
          image_url_front: string | null;
          image_url_back: string | null;
          design_config: unknown;
        } | null;
        designImageUrl = d?.image_url ?? undefined;
        designImageUrlFront = d?.image_url_front ?? undefined;
        designImageUrlBack = d?.image_url_back ?? undefined;
        frontLayer = firstLayerPos(d?.design_config, "front");
        backLayer = firstLayerPos(d?.design_config, "back");
      }
      const extras = {
        designImageUrl,
        designImageUrlFront,
        designImageUrlBack,
        frontLayer,
        backLayer,
        productId: product.id,
      };
      setRecipients([
        blankRecipient(returningCartItemId, defaultSize, defaultColor, extras),
        blankRecipient(returningCartItemId, defaultSize, defaultColor, extras),
        blankRecipient(returningCartItemId, defaultSize, defaultColor, extras),
      ]);
    })();
  }, [step, product, returningCartItemId, returningDesignId, fromCart, recipients.length]);

  // Cart-entry seeding: load all of the user's cart_items, seed one
  // recipient per row carrying that row's id/size/color/qty. Empty cart
  // renders inline empty-state (see render branch below) — no redirect.
  const [cartChecked, setCartChecked] = useState(false);
  useEffect(() => {
    if (step !== 3 || !fromCart || recipients.length > 0 || cartChecked) return;
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/bulk-start?step=3%26fromCart=1");
        return;
      }
      const { data: rows } = await supabase
        .from("cart_items")
        .select("id, quantity, size, color, design:designs(product_id, image_url, image_url_front, image_url_back, design_config)")
        .eq("user_id", user.id);
      type DesignSelect = {
        product_id: string;
        image_url: string | null;
        image_url_front: string | null;
        image_url_back: string | null;
        design_config: unknown;
      };
      const items = (rows as Array<{
        id: string;
        quantity: number;
        size: string;
        color: string;
        design: DesignSelect | DesignSelect[] | null;
      }>) ?? [];
      setCartChecked(true);
      if (items.length === 0) return;
      // Display product = the first item's product (most carts are single-design).
      const firstDesign = Array.isArray(items[0].design) ? items[0].design[0] : items[0].design;
      const firstProduct = firstDesign ? getProductById(firstDesign.product_id) : null;
      if (firstProduct) setProduct(firstProduct);
      setRecipients(
        items.map((r) => {
          const design = Array.isArray(r.design) ? r.design[0] : r.design;
          return {
            ...blankRecipient(r.id, r.size, r.color, {
              designImageUrl: design?.image_url ?? undefined,
              designImageUrlFront: design?.image_url_front ?? undefined,
              designImageUrlBack: design?.image_url_back ?? undefined,
              frontLayer: firstLayerPos(design?.design_config, "front"),
              backLayer: firstLayerPos(design?.design_config, "back"),
              productId: design?.product_id,
            }),
            quantity: Math.max(1, r.quantity | 0),
          };
        }),
      );
    })();
  }, [step, fromCart, recipients.length, cartChecked, router]);

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
      blankRecipient(source.cart_item_id, source.size || defaultSize, source.color || defaultColor, {
        designImageUrl: source.design_image_url,
        designImageUrlFront: source.design_image_url_front,
        designImageUrlBack: source.design_image_url_back,
        frontLayer: source.front_layer,
        backLayer: source.back_layer,
        productId: source.product_id,
      }),
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

  async function removeRow(idx: number) {
    const removed = recipients[idx];
    const remaining = recipients.filter((_, i) => i !== idx);
    setRecipients(remaining);
    if (!removed?.cart_item_id) return;
    const stillReferenced = remaining.some((r) => r.cart_item_id === removed.cart_item_id);
    if (stillReferenced) return;
    // Last row referencing this cart_item — clean it up. RLS gates the delete
    // to rows owned by the current user. Best-effort: a failure here just
    // leaves an orphan row that the next /api/orders/create call cleans up.
    const supabase = createClient();
    await supabase.from("cart_items").delete().eq("id", removed.cart_item_id);
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
              {recipients.map((r, idx) => {
                const productForRow = r.product_id ? getProductById(r.product_id) : null;
                const frontPhoto = productForRow ? getDesignerPhoto(productForRow, "front", r.color) : null;
                const backPhoto = productForRow ? getDesignerPhoto(productForRow, "back", r.color) : null;
                const frontSpec = productForRow?.measurements?.printSpecs?.front;
                const backSpec = productForRow?.measurements?.printSpecs?.back;
                const frontStyle = computeOverlayStyle(frontSpec, r.front_layer);
                const backStyle = computeOverlayStyle(backSpec, r.back_layer);
                const frontUrl = r.design_image_url_front ?? r.design_image_url;
                const hasThumbs = !!(frontPhoto || backPhoto);
                return (
                  <div key={idx} style={termCard}>
                    <span style={termBadge}>#{idx + 1}</span>
                    <button type="button" onClick={() => removeRow(idx)} style={termClose} aria-label="Remove">×</button>

                    {hasThumbs && (
                      <div style={termThumbColumn}>
                        {frontPhoto && (
                          <div style={termMockTile}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={frontPhoto} alt="front" style={termMockBlank} />
                            {frontUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={frontUrl} alt="" style={frontStyle ?? termMockDesignFallback} />
                            )}
                          </div>
                        )}
                        {backPhoto && (
                          <div style={termMockTile}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={backPhoto} alt="back" style={termMockBlank} />
                            {r.design_image_url_back && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.design_image_url_back} alt="" style={backStyle ?? termMockDesignFallback} />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={termFormColumn}>
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
                  </div>
                );
              })}

              {recipients.length > 0 && (
                <button type="button" onClick={addRow} style={termAddBtn}>
                  [+ Add recipient]
                </button>
              )}

              {fromCart && recipients.length === 0 && cartChecked && (
                <div style={termEmptyCart}>
                  [ cart is empty ]{" "}
                  <a href="/catalog" style={termEmptyLink}>[+ browse catalog →]</a>
                </div>
              )}
            </div>

            {recipients.length > 0 && (
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
            )}
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
  padding: "20px 16px 16px",
  fontFamily: TERM_FONT,
  fontSize: 13,
  color: "#1a1a1a",
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
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

const termThumbColumn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  flexShrink: 0,
};

const termFormColumn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  flex: 1,
  minWidth: 0,
};

const termMockTile: React.CSSProperties = {
  position: "relative",
  width: 80,
  height: 80,
  border: "1px solid #1a1a1a",
  background: "#fff",
  overflow: "hidden",
};

const termMockBlank: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
};

// Fallback overlay style used only when print-area or layer geometry is
// missing (legacy designs, products without measurements). Hardcoded
// chest-area approximation — wrong for any design that's been resized or
// moved, but better than nothing.
const termMockDesignFallback: React.CSSProperties = {
  position: "absolute",
  top: "28%",
  left: "34%",
  width: "32%",
  height: "auto",
  objectFit: "contain",
  pointerEvents: "none",
};

const termEmptyCart: React.CSSProperties = {
  fontFamily: TERM_FONT,
  fontSize: 14,
  color: "#1a1a1a",
  padding: "24px 12px",
  textAlign: "center",
};

const termEmptyLink: React.CSSProperties = {
  color: "#1a1a1a",
  textDecoration: "none",
  fontFamily: TERM_FONT,
  marginLeft: 8,
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
