"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, limiters } from "@/lib/ratelimit";
import type { AuthActionResult } from "@/app/signup/actions";

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const reqHeaders = await headers();
  const ip = getClientIp({ headers: reqHeaders } as Request);

  if (limiters.loginAttempt) {
    const { success } = await limiters.loginAttempt.limit(`login:${ip}`);
    if (!success) {
      return { ok: false, error: "Too many login attempts. Try again in a minute." };
    }
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (email.length > 254) {
    return { ok: false, error: "Input too long." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
