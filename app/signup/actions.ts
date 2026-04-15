"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, limiters } from "@/lib/ratelimit";

export type AuthActionResult = { ok: true } | { ok: false; error: string };

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const reqHeaders = await headers();
  const ip = getClientIp({ headers: reqHeaders } as Request);

  if (limiters.signupAttempt) {
    const { success } = await limiters.signupAttempt.limit(`signup:${ip}`);
    if (!success) {
      return { ok: false, error: "Too many signup attempts. Try again in an hour." };
    }
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!email || !password || !displayName) {
    return { ok: false, error: "All fields are required." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (email.length > 254 || displayName.length > 100) {
    return { ok: false, error: "Input too long." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
