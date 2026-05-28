import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { signedGetForAsset } from "@/lib/render/asset-url";

export const runtime = "nodejs";

// Admin-only "view this render asset" route. Loads the polymorphic column
// value (R2 key or legacy Supabase URL), mints a 5-min signed GET for R2
// keys (or passes through legacy URLs), and 302-redirects. Keeps the
// short-lived signed URL out of the admin HTML and out of browser history.

type Side = "front" | "back";
type Kind = "print" | "mockup";

const SIDES = new Set<Side>(["front", "back"]);
const KINDS = new Set<Kind>(["print", "mockup"]);
const TTL_SECONDS = 300;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const itemId = url.searchParams.get("item");
  const kindParam = url.searchParams.get("kind");
  const sideParam = url.searchParams.get("side");
  if (!itemId || !kindParam || !sideParam) {
    return Response.json({ error: "item, kind, side required" }, { status: 400 });
  }
  if (!KINDS.has(kindParam as Kind) || !SIDES.has(sideParam as Side)) {
    return Response.json({ error: "kind must be print|mockup, side must be front|back" }, { status: 400 });
  }
  const column = `${kindParam}_url_${sideParam}`;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("order_items")
    .select(`${column}`)
    .eq("id", itemId)
    .single();
  if (error || !data) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const value = (data as unknown as Record<string, string | null>)[column] ?? null;
  const signed = await signedGetForAsset(value, TTL_SECONDS);
  if (!signed) {
    return Response.json({ error: "not rendered" }, { status: 409 });
  }
  return Response.redirect(signed, 302);
}
