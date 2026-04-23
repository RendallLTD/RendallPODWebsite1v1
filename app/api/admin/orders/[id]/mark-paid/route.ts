import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { markOrderPaid } from "@/lib/orders/mark-paid";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const result = await markOrderPaid(id);

  if (!result.ok) {
    return Response.json(
      { ok: false, reason: result.reason },
      { status: result.status ?? 400 },
    );
  }
  return Response.json({ ok: true, status: "paid", alreadyPaid: result.alreadyPaid ?? false });
}
