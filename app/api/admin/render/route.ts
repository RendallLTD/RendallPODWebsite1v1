import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { renderOrderItems } from "@/lib/render/run";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const itemIds = Array.isArray(body?.order_item_ids) ? body.order_item_ids : null;
  if (!itemIds || itemIds.length === 0) {
    return Response.json({ error: "order_item_ids required" }, { status: 400 });
  }

  const { rendered, skipped } = await renderOrderItems(itemIds);
  return Response.json({ rendered, skipped });
}
