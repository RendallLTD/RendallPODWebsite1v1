"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getProductById } from "@/lib/products";

type CartItem = {
  id: string;
  design_id: string;
  quantity: number;
  size: string;
  color: string;
  design: { product_id: string; name: string } | null;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("US");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("cart_items")
        .select("*, design:designs(product_id, name)")
        .eq("user_id", user.id);
      setItems((data as CartItem[]) || []);
      setLoading(false);
    })();
  }, [router]);

  function getItemPrice(item: CartItem): number {
    if (!item.design) return 0;
    const product = getProductById(item.design.product_id);
    return product ? product.priceCents * item.quantity : 0;
  }

  const totalCents = items.reduce((sum, item) => sum + getItemPrice(item), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create order
    const { data: order } = await supabase.from("orders").insert({
      user_id: user.id,
      status: "pending",
      total_cents: totalCents,
      shipping_address: { name, address, city, state, zip, country },
    }).select("id").single();

    if (order) {
      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        design_id: item.design_id,
        product_name: item.design?.name || "Design",
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        unit_price_cents: item.design ? (getProductById(item.design.product_id)?.priceCents || 0) : 0,
      }));
      await supabase.from("order_items").insert(orderItems);

      // Clear cart
      await supabase.from("cart_items").delete().eq("user_id", user.id);

      router.push(`/checkout/success?order=${order.id}`);
    }

    setSubmitting(false);
  }

  if (loading) return <div className="container" style={{ padding: "80px 0" }}><p>Loading...</p></div>;
  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <section className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>Shipping Address</h2>
            <div className="auth-field">
              <label>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="auth-field">
              <label>Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="checkout-row">
              <div className="auth-field">
                <label>City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="auth-field">
                <label>State</label>
                <input type="text" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
              <div className="auth-field">
                <label>ZIP</label>
                <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} required />
              </div>
            </div>
            <div className="auth-field">
              <label>Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
            <button type="submit" className="btn btn--primary btn--lg" style={{ width: "100%", marginTop: 16 }} disabled={submitting}>
              {submitting ? "Placing order..." : `Place order — $${(totalCents / 100).toFixed(2)}`}
            </button>
          </form>

          <div className="checkout-summary">
            <h2>Order Summary</h2>
            {items.map((item) => (
              <div key={item.id} className="checkout-summary__item">
                <span>{item.design?.name || "Design"} &times; {item.quantity}</span>
                <span>${(getItemPrice(item) / 100).toFixed(2)}</span>
              </div>
            ))}
            <div className="checkout-summary__total">
              <span>Total</span>
              <span>${(totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
