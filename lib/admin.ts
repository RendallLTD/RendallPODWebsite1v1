/**
 * Env-based admin allowlist. Populate `ADMIN_USER_IDS` with comma-separated
 * Supabase user UUIDs. Intentionally env-backed (not a profiles.is_admin
 * column) because there's a single admin at the moment. Promote to a DB flag
 * when a second admin appears.
 */

export function getAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return getAdminUserIds().includes(userId);
}
