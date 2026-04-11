import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. Bypasses RLS.
// Server-only — NEVER import from a client component. Doing so leaks the
// service-role key to the browser and gives any visitor full DB access.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
