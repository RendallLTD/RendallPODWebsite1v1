"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getProductById } from "@/lib/products";
import AddressAutocomplete, { type ParsedPlace } from "@/components/checkout/AddressAutocomplete";

type CartItem = {
  id: string;
  quantity: number;
  size: string;
  color: string;
  // Supabase embed returns array for hasMany, object for hasOne. design_id is a
  // single FK but supabase-js types it as array — handle both shapes.
  design: { product_id: string; name: string } | { product_id: string; name: string }[] | null;
};

function firstDesign(d: CartItem["design"]): { product_id: string; name: string } | null {
  if (!d) return null;
  return Array.isArray(d) ? d[0] ?? null : d;
}

type Recipient = {
  cart_item_id: string;
  name: string;
  line1: string;
  city: string;
  state: string;
  country: string;
  postal: string;
  phone: string;
  size: string;
  color: string;
  quantity: number;
};

function blankRecipient(cartItemId: string, size: string, color: string): Recipient {
  return {
    cart_item_id: cartItemId,
    name: "",
    line1: "",
    city: "",
    state: "",
    country: "US",
    postal: "",
    phone: "",
    size,
    color,
    quantity: 1,
  };
}

export default function ShippingPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/checkout/shipping");
        return;
      }
      const { data } = await supabase
        .from("cart_items")
        .select("id, quantity, size, color, design:designs(product_id, name)")
        .eq("user_id", user.id);
      const cart = (data as CartItem[]) ?? [];
      if (cart.length === 0) {
        router.push("/cart");
        return;
      }
      setItems(cart);
      // Default: one recipient per cart_item, prefilling size/color/qty
      // from the cart row. Sellers split rows themselves via "Add recipient".
      const seeded = cart.map((ci) => ({
        ...blankRecipient(ci.id, ci.size, ci.color),
        quantity: Math.max(1, ci.quantity | 0),
      }));
      const bulkMode = typeof window !== "undefined" && sessionStorage.getItem("rendall_bulk_mode") === "1";
      if (bulkMode && cart.length > 0) {
        const src = cart[0];
        seeded.push(blankRecipient(src.id, src.size, src.color));
        seeded.push(blankRecipient(src.id, src.size, src.color));
      }
      setRecipients(seeded);
      setLoading(false);
    })();
  }, [router]);

  const cartById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  function update<K extends keyof Recipient>(idx: number, k: K, v: Recipient[K]) {
    setRecipients((rs) => rs.map((r, i) => (i === idx ? { ...r, [k]: v } : r)));
  }

  function applyPlace(idx: number, p: ParsedPlace) {
    setRecipients((rs) =>
      rs.map((r, i) =>
        i === idx
          ? {
              ...r,
              line1: p.line1 || r.line1,
              city: p.city || r.city,
              state: p.state || r.state,
              country: p.country || r.country,
              postal: p.postal || r.postal,
            }
          : r,
      ),
    );
  }

  function addRecipient() {
    // Clone the design slot of the first cart_item — that's the bulk-checkout
    // assumption: one design, many ship-tos. Pre-fill color from the source
    // cart row so a power-user can edit just the address.
    const source = items[0];
    if (!source) return;
    setRecipients((rs) => [
      ...rs,
      blankRecipient(source.id, source.size, source.color),
    ]);
  }

  function removeRecipient(idx: number) {
    setRecipients((rs) => (rs.length === 1 ? rs : rs.filter((_, i) => i !== idx)));
  }

  function unitPriceFor(cartItemId: string): number {
    const ci = cartById.get(cartItemId);
    const d = ci ? firstDesign(ci.design) : null;
    if (!d) return 0;
    const product = getProductById(d.product_id);
    return product ? product.priceCents : 0;
  }

  function productFor(cartItemId: string) {
    const ci = cartById.get(cartItemId);
    const d = ci ? firstDesign(ci.design) : null;
    return d ? getProductById(d.product_id) : null;
  }

  function designNameFor(cartItemId: string): string {
    const ci = cartById.get(cartItemId);
    return firstDesign(ci?.design ?? null)?.name ?? "Design";
  }

  const totalCents = recipients.reduce(
    (sum, r) => sum + unitPriceFor(r.cart_item_id) * r.quantity,
    0,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipients }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Failed to create order.");
        return;
      }
      router.push(`/checkout/payment/${json.order_id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container" style={{ padding: "80px 0" }}><p>Loading...</p></div>;

  return (
    <section className="checkout-page">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1>Shipping details</h1>
        <p style={{ opacity: 0.75, marginBottom: 24 }}>
          Add one recipient per shirt. We&apos;ll produce and ship each item
          individually once payment is confirmed.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          {recipients.map((r, idx) => {
            const product = productFor(r.cart_item_id);
            const sizes = product?.sizes ?? [r.size];
            const colors = product?.colors ?? [r.color];
            const lineCents = unitPriceFor(r.cart_item_id) * r.quantity;
            return (
              <fieldset
                key={idx}
                style={{
                  border: "1px solid var(--border, #e5e5e5)",
                  borderRadius: 8,
                  padding: 12,
                  display: "grid",
                  gap: 8,
                  margin: 0,
                }}
              >
                <legend style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 8px" }}>
                  <strong>Recipient {idx + 1}</strong>
                  <span style={{ fontSize: 13, opacity: 0.7, marginLeft: 12 }}>
                    {r.quantity}× {designNameFor(r.cart_item_id)} — ${(lineCents / 100).toFixed(2)}
                  </span>
                  {recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecipient(idx)}
                      style={{ marginLeft: 12, background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 13 }}
                    >
                      Remove
                    </button>
                  )}
                </legend>
                <label>
                  Full name
                  <input required value={r.name} onChange={(e) => update(idx, "name", e.target.value)} />
                </label>
                <label>
                  Street address
                  <AddressAutocomplete
                    required
                    value={r.line1}
                    onChange={(v) => update(idx, "line1", v)}
                    onPlaceSelect={(p) => applyPlace(idx, p)}
                  />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label>
                    City
                    <input required value={r.city} onChange={(e) => update(idx, "city", e.target.value)} />
                  </label>
                  <label>
                    State / Province
                    <input required value={r.state} onChange={(e) => update(idx, "state", e.target.value)} />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                  <label>
                    Country
                    <select required value="US" disabled>
                      <option value="US">United States</option>
                    </select>
                  </label>
                  <label>
                    Postal code
                    <input required maxLength={20} value={r.postal} onChange={(e) => update(idx, "postal", e.target.value)} />
                  </label>
                </div>
                <label>
                  Phone
                  <input
                    required
                    inputMode="tel"
                    placeholder="+1 555 555 5555"
                    value={r.phone}
                    onChange={(e) => update(idx, "phone", e.target.value)}
                  />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 12 }}>
                  <label>
                    Size
                    <select required value={r.size} onChange={(e) => update(idx, "size", e.target.value)}>
                      {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label>
                    Color
                    <select required value={r.color} onChange={(e) => update(idx, "color", e.target.value)}>
                      {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label>
                    Qty
                    <input
                      required
                      type="number"
                      min={1}
                      max={1000}
                      value={r.quantity}
                      onChange={(e) => update(idx, "quantity", Math.max(1, Math.min(1000, Number(e.target.value) | 0)))}
                    />
                  </label>
                </div>
              </fieldset>
            );
          })}

          <button
            type="button"
            onClick={addRecipient}
            className="btn btn--outline"
            style={{ justifySelf: "start" }}
          >
            + Add recipient
          </button>

          <div className="checkout-summary" style={{ marginTop: 8 }}>
            <div className="checkout-summary__total">
              <span>{recipients.length} recipient{recipients.length === 1 ? "" : "s"} · {recipients.reduce((s, r) => s + r.quantity, 0)} shirt{recipients.reduce((s, r) => s + r.quantity, 0) === 1 ? "" : "s"}</span>
              <span>${(totalCents / 100).toFixed(2)}</span>
            </div>
          </div>

          {error && <p style={{ color: "crimson" }}>{error}</p>}

          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/cart" className="btn btn--outline" style={{ flex: 1 }}>Back to cart</Link>
            <button type="submit" className="btn btn--primary" disabled={submitting} style={{ flex: 2 }}>
              {submitting ? "Placing order..." : "Place order"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
