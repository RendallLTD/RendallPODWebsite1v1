"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Design = {
  id: string;
  product_id: string;
  name: string;
  image_url: string | null;
  created_at: string;
};

export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("designs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setDesigns(data || []);
      setLoading(false);
    })();
  }, []);

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("designs").delete().eq("id", id);
    setDesigns((prev) => prev.filter((d) => d.id !== id));
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
                  <Link href={`/design/${d.product_id}`} className="btn btn--outline btn--sm">Edit</Link>
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
