"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#3b82f6",
  printing: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#22c55e",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Exclude pending drafts — these are in-flight checkouts that haven't
      // been paid yet and shouldn't appear as "orders" to the user.
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "pending")
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading orders...</p>;

  return (
    <div>
      <h1 className="dashboard__title">Orders</h1>
      {orders.length === 0 ? (
        <div className="dashboard__empty">
          <p>No orders yet. Start designing and place your first order!</p>
        </div>
      ) : (
        <div className="orders-table">
          <div className="orders-table__header">
            <span>Order</span>
            <span>Date</span>
            <span>Status</span>
            <span>Total</span>
          </div>
          {orders.map((o) => (
            <div key={o.id} className="orders-table__row">
              <span className="orders-table__id">#{o.id.slice(0, 8)}</span>
              <span>{new Date(o.created_at).toLocaleDateString()}</span>
              <span>
                <span className="status-badge" style={{ background: statusColors[o.status] || "#999" }}>
                  {o.status}
                </span>
              </span>
              <span>${(o.total_cents / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
