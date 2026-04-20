"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getProductById } from "@/lib/products";
import { COUNTRIES } from "@/lib/countries";

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

type ShippingForm = {
  name: string;
  line1: string;
  city: string;
  state: string;
  country: string;
  postal: string;
  phone: string;
};

const EMPTY: ShippingForm = {
  name: "",
  line1: "",
  city: "",
  state: "",
  country: "US",
  postal: "",
  phone: "",
};

export default function ShippingPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ShippingForm>(EMPTY);
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
      setLoading(false);
    })();
  }, [router]);

  function getItemPrice(item: CartItem): number {
    const d = firstDesign(item.design);
    if (!d) return 0;
    const product = getProductById(d.product_id);
    return product ? product.priceCents * item.quantity : 0;
  }
  const totalCents = items.reduce((sum, i) => sum + getItemPrice(i), 0);

  function update<K extends keyof ShippingForm>(k: K, v: ShippingForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shipping: form }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Failed to create order.");
        return;
      }
      router.push(`/checkout/placed/${json.order_id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container" style={{ padding: "80px 0" }}><p>Loading...</p></div>;

  return (
    <section className="checkout-page">
      <div className="container">
        <h1>Shipping details</h1>
        <p style={{ opacity: 0.75, marginBottom: 24 }}>
          Tell us where to send the order. We&apos;ll produce and ship it once
          payment is confirmed.
        </p>
        <div className="checkout-summary">
          <h2>Order summary</h2>
          {items.map((item) => (
            <div key={item.id} className="checkout-summary__item">
              <span>{firstDesign(item.design)?.name || "Design"} × {item.quantity}</span>
              <span>${(getItemPrice(item) / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="checkout-summary__total">
            <span>Total</span>
            <span>${(totalCents / 100).toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "grid", gap: 16, maxWidth: 560 }}>
          <label>
            Full name
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label>
            Street address
            <input required value={form.line1} onChange={(e) => update("line1", e.target.value)} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label>
              City
              <input required value={form.city} onChange={(e) => update("city", e.target.value)} />
            </label>
            <label>
              State / Province
              <input required value={form.state} onChange={(e) => update("state", e.target.value)} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <label>
              Country
              <select required value={form.country} onChange={(e) => update("country", e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Postal code
              <input required maxLength={20} value={form.postal} onChange={(e) => update("postal", e.target.value)} />
            </label>
          </div>
          <label>
            Phone
            <input
              required
              inputMode="tel"
              placeholder="+1 555 555 5555"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>

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
