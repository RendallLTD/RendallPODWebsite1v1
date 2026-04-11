"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("");
  const [designCount, setDesignCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("display_name, plan").eq("id", user.id).single();
      if (profile) {
        setDisplayName(profile.display_name || user.email || "");
        setPlan(profile.plan || "free");
      }

      const { count: dc } = await supabase.from("designs").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      setDesignCount(dc || 0);

      // Exclude pending drafts — these are in-flight checkouts and shouldn't
      // count as "orders" in the overview stat. Matches the filter on
      // /dashboard/orders so the count and the list stay consistent.
      const { count: oc } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "pending");
      setOrderCount(oc || 0);
    })();
  }, []);

  return (
    <div>
      <h1 className="dashboard__title">Welcome back{displayName ? `, ${displayName}` : ""}!</h1>

      <div className="dashboard__stats">
        <div className="dashboard__stat">
          <div className="dashboard__stat-number">{designCount}</div>
          <div className="dashboard__stat-label">Designs</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-number">{orderCount}</div>
          <div className="dashboard__stat-label">Orders</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-number" style={{ textTransform: "capitalize" }}>{plan}</div>
          <div className="dashboard__stat-label">Plan</div>
        </div>
      </div>

      <div className="dashboard__actions">
        <Link href="/catalog" className="btn btn--primary">Create new design</Link>
        <Link href="/dashboard/orders" className="btn btn--outline">View orders</Link>
      </div>
    </div>
  );
}
