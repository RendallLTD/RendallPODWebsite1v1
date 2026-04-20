import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    redirect("/login?next=/admin");
  }
  return (
    <section className="container" style={{ padding: "32px 0 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Admin</h1>
        <span style={{ fontSize: 13, opacity: 0.6 }}>Signed in as {user.email}</span>
      </div>
      {children}
    </section>
  );
}
