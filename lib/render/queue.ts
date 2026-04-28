import { createAdminClient } from "@/lib/supabase/admin";

// Persisted queue helpers. A job row exists for every order_item that needs
// rendering. State machine: pending -> running -> done|failed. Failed jobs
// keep last_error and can be re-driven by re-POSTing to the admin render
// route (which calls ensureAndClaim).

type JobRow = {
  order_item_id: string;
  status: "pending" | "running" | "done" | "failed";
  attempts: number;
  last_error: string | null;
};

// Insert a pending job row per order_item. Idempotent: existing rows are
// left alone (use ensureAndClaim to reset failed/done -> pending).
export async function enqueueRenderJobs(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: items, error: loadErr } = await admin
    .from("order_items")
    .select("id")
    .eq("order_id", orderId);
  if (loadErr) return { ok: false, error: loadErr.message };
  if (!items || items.length === 0) return { ok: true };

  // upsert with onConflict so re-running enqueue (e.g. webhook retry after
  // markOrderPaid succeeded but the row insert failed) is idempotent.
  const { error: insertErr } = await admin
    .from("render_jobs")
    .upsert(
      items.map((i) => ({ order_item_id: i.id, status: "pending" })),
      { onConflict: "order_item_id", ignoreDuplicates: true },
    );
  if (insertErr) return { ok: false, error: insertErr.message };
  return { ok: true };
}

// For each item id: upsert a pending row (creates one if missing, resets
// failed/done -> pending so re-runs from the admin button drain work).
// Then atomically flip pending -> running and return the rows we own.
export async function ensureAndClaim(itemIds: string[]): Promise<JobRow[]> {
  const admin = createAdminClient();

  // Reset any non-pending rows back to pending and bump updated_at.
  await admin
    .from("render_jobs")
    .upsert(
      itemIds.map((id) => ({
        order_item_id: id,
        status: "pending",
        last_error: null,
        locked_at: null,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "order_item_id" },
    );

  const { data: claimed } = await admin
    .from("render_jobs")
    .update({
      status: "running",
      locked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("order_item_id", itemIds)
    .eq("status", "pending")
    .select("order_item_id, status, attempts, last_error");
  return (claimed ?? []) as JobRow[];
}

export async function markJobDone(itemId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("render_jobs")
    .update({
      status: "done",
      last_error: null,
      locked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("order_item_id", itemId);
}

export async function markJobFailed(itemId: string, reason: string): Promise<void> {
  const admin = createAdminClient();
  // Increment attempts via a separate fetch+update; the JS client does not
  // expose raw SQL increments. Acceptable race: two concurrent failure marks
  // for the same item is implausible because we hold the running lock.
  const { data: row } = await admin
    .from("render_jobs")
    .select("attempts")
    .eq("order_item_id", itemId)
    .single();
  await admin
    .from("render_jobs")
    .update({
      status: "failed",
      last_error: reason,
      locked_at: null,
      attempts: (row?.attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("order_item_id", itemId);
}
