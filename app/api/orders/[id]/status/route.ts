import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforce, getClientIp, limiters } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await enforce(limiters.api, `order-status:${getClientIp(request)}`);
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (error || !order) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  if (order.user_id !== user.id) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  return Response.json({ status: order.status });
}
