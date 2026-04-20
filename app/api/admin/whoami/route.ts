import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";

// Header uses this to decide whether to render the "Admin" link. Returns 200
// for admins, 403 otherwise. Never exposes the ADMIN_USER_IDS list.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return Response.json({ ok: false }, { status: 403 });
  }
  return Response.json({ ok: true });
}
