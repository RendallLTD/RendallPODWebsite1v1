"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getProductById } from "@/lib/products";

type CartItem = {
  id: string;
  design_id: string;
  quantity: number;
  size: string;
  color: string;
  design: { product_id: string; name: string; image_url: string | null } | null;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("cart_items")
        .select("*, design:designs(product_id, name, image_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems((data as CartItem[]) || []);
      setLoading(false);
    })();
  }, []);

  async function updateQuantity(id: string, quantity: number) {
    if (quantity < 1) return removeItem(id);
    const supabase = createClient();
    await supabase.from("cart_items").update({ quantity }).eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }

  async function removeItem(id: string) {
    const supabase = createClient();
    await supabase.from("cart_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function getItemPrice(item: CartItem): number {
    if (!item.design) return 0;
    const product = getProductById(item.design.product_id);
    return product ? product.priceCents * item.quantity : 0;
  }

  const totalCents = items.reduce((sum, item) => sum + getItemPrice(item), 0);

  if (loading) return <div className="container" style={{ padding: "80px 0" }}><p>Loading cart...</p></div>;

  return (
    <section className="cart-page">
      <div className="container">
        <h1>Your Cart</h1>
        {items.length === 0 ? (
          <div className="dashboard__empty">
            <p>Your cart is empty.</p>
            <Link href="/catalog" className="btn btn--primary">Browse catalog</Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => {
                const product = item.design ? getProductById(item.design.product_id) : null;
                return (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item__img">
                      {item.design?.image_url ? <img src={item.design.image_url} alt="" /> : product?.emoji || "🎨"}
                    </div>
                    <div className="cart-item__info">
                      <div className="cart-item__name">{item.design?.name || "Design"}</div>
                      <div className="cart-item__meta">{item.size} &middot; {item.color}</div>
                    </div>
                    <div className="cart-item__qty">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <div className="cart-item__price">${(getItemPrice(item) / 100).toFixed(2)}</div>
                    <button className="cart-item__remove" onClick={() => removeItem(item.id)}>&times;</button>
                  </div>
                );
              })}
            </div>
            <div className="cart-summary">
              <div className="cart-summary__total">
                <span>Total</span>
                <span>${(totalCents / 100).toFixed(2)}</span>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--lg"
                style={{ width: "100%", cursor: "not-allowed", opacity: 0.6 }}
                disabled
              >
                Checkout opening soon
              </button>
              <p style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, opacity: 0.75, textAlign: "center" }}>
                We&apos;re finalising our payment provider. Your cart is saved — you can return and check out as soon as we reopen.
              </p>
              <Link href="/catalog" className="btn btn--outline" style={{ width: "100%", marginTop: 12 }}>
                Continue shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
