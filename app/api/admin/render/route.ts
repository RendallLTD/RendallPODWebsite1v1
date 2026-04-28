import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { renderOrderItems } from "@/lib/render/run";
import { ensureAndClaim, markJobDone, markJobFailed } from "@/lib/render/queue";

export const runtime = "nodejs";

// Worker entry point. Driven by the admin "Re-render" button (and any future
// cron/poll). Ensures a render_jobs row per requested item, claims them by
// flipping pending -> running, runs renderOrderItems, then marks each done
// or failed. New behavior: failures persist as status='failed' + last_error
// so admin sees them on the order detail page and can re-click to retry.
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

  const claimed = await ensureAndClaim(itemIds);
  const claimedIds = claimed.map((j) => j.order_item_id);
  if (claimedIds.length === 0) {
    return Response.json({ rendered: [], skipped: [], note: "no jobs claimed" });
  }

  const { rendered, skipped } = await renderOrderItems(claimedIds);

  const renderedSet = new Set(rendered.map((r) => r.order_item_id));
  await Promise.all(rendered.map((r) => markJobDone(r.order_item_id)));

  // For each skipped item that has no rendered counterpart, mark failed with
  // the reason. Items that partially rendered (front ok, back skipped) are in
  // both lists; those should be 'done' not 'failed' — the per-side reason is
  // forensic only.
  const fails = skipped.filter((s) => !renderedSet.has(s.order_item_id));
  await Promise.all(fails.map((s) => markJobFailed(s.order_item_id, s.reason)));

  return Response.json({ rendered, skipped });
}
