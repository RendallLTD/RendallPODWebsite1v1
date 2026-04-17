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

  if (loading) return <div className="container" style={{ padding: "80px 0" }}><p>Loading...</p></div>;
  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <section className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
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
          <p style={{ marginTop: 16, fontSize: 14, opacity: 0.75 }}>
            Checkout is temporarily paused while we finalise our payment provider. Your cart is saved and will be here when we reopen.
          </p>
          <button
            type="button"
            className="btn btn--primary btn--lg"
            style={{ width: "100%", marginTop: 16, cursor: "not-allowed", opacity: 0.6 }}
            disabled
          >
            Checkout opening soon
          </button>
        </div>
      </div>
    </section>
  );
}
