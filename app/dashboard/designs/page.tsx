"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getProductById } from "@/lib/products";
import { isV2 } from "@/lib/design-schema";

type Design = {
  id: string;
  product_id: string;
  name: string;
  image_url: string | null;
  created_at: string;
};

export default function DesignsPage() {
  const router = useRouter();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("designs")
        .select("id, product_id, name, image_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) console.error("[designs] list failed", error);
      setDesigns(data ?? []);
      setLoading(false);
    })();
  }, []);

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("designs").delete().eq("id", id);
    if (error) {
      // FK RESTRICT on order_items.design_id → PostgreSQL error 23503
      if (error.code === "23503") {
        alert("This design is part of an order and can’t be deleted.");
      } else {
        alert("Failed to delete design. Please try again.");
      }
      return;
    }
    setDesigns((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleReorder(designId: string, productId: string) {
    if (reorderingId) return;
    setReorderingId(designId);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: row, error: loadErr } = await supabase
        .from("designs")
        .select("design_config")
        .eq("id", designId)
        .maybeSingle();
      if (loadErr || !row) {
        console.error("[designs] reorder: load failed", loadErr);
        alert("Couldn't reorder this design. Please try again.");
        return;
      }

      // Pull last-saved size + color from the snapshot. Fall back to the
      // product's first available option if anything is missing or the
      // saved color/size has since been removed from the catalog.
      const product = getProductById(productId);
      const fallbackSize = product?.sizes[0] ?? "";
      const fallbackColor = product?.colors[0] ?? "";
      let size = fallbackSize;
      let color = fallbackColor;
      if (isV2(row.design_config)) {
        const cfg = row.design_config;
        size = product?.sizes.includes(cfg.size) ? cfg.size : fallbackSize;
        color = product?.colors.includes(cfg.color) ? cfg.color : fallbackColor;
      }

      const { error: cartErr } = await supabase.from("cart_items").insert({
        user_id: user.id,
        design_id: designId,
        quantity: 1,
        size,
        color,
      });
      if (cartErr) {
        console.error("[designs] reorder: cart insert failed", cartErr);
        alert("Couldn't add to cart. Please try again.");
        return;
      }

      router.push("/bulk-start?step=3&fromCart=1");
    } finally {
      setReorderingId(null);
    }
  }

  if (loading) return <p>Loading designs...</p>;

  return (
    <div>
      <h1 className="dashboard__title">My Designs</h1>
      {designs.length === 0 ? (
        <div className="dashboard__empty">
          <p>No designs yet.</p>
          <Link href="/catalog" className="btn btn--primary">Browse catalog to start designing</Link>
        </div>
      ) : (
        <div className="designs-grid">
          {designs.map((d) => (
            <div key={d.id} className="design-card">
              <div className="design-card__img">
                {d.image_url ? <img src={d.image_url} alt={d.name || "Design"} /> : "🎨"}
              </div>
              <div className="design-card__body">
                <div className="design-card__name">{d.name || "Untitled"}</div>
                <div className="design-card__date">{new Date(d.created_at).toLocaleDateString()}</div>
                <div className="design-card__actions">
                  <button
                    className="btn btn--primary btn--sm"
                    disabled={reorderingId === d.id}
                    onClick={() => handleReorder(d.id, d.product_id)}
                  >
                    {reorderingId === d.id ? "Adding…" : "Reorder"}
                  </button>
                  <Link href={`/design/${d.product_id}?designId=${d.id}`} className="btn btn--outline btn--sm">Edit</Link>
                  <button className="btn btn--sm" style={{ color: "#dc2626" }} onClick={() => handleDelete(d.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
