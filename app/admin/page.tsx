import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminOrdersTable from "./AdminOrdersTable";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  user_id: string;
  status: string;
  total_cents: number;
  shipping_address: { city?: string; country?: string } | null;
  created_at: string;
  order_items: { id: string; print_url_front: string | null; mockup_url_front: string | null }[];
};

export default async function AdminPage() {
  const admin = createAdminClient();
  const { data: orders, error } = await admin
    .from("orders")
    .select("id, user_id, status, total_cents, shipping_address, created_at, order_items(id, print_url_front, mockup_url_front)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return <p style={{ color: "crimson" }}>Failed to load orders: {error.message}</p>;
  }

  const rows = (orders as OrderRow[]) ?? [];

  return (
    <>
      <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 16 }}>
        Latest 200 orders. Select rows to render files or export an XLSX for the factory.
      </p>
      <AdminOrdersTable orders={rows} />
      <div style={{ marginTop: 24, fontSize: 13, opacity: 0.6 }}>
        <Link href="/dashboard">Back to dashboard</Link>
      </div>
    </>
  );
}
