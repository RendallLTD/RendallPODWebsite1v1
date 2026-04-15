import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

// Upstash credentials are optional. When absent, rate limiting is disabled
// (every request passes). This keeps local dev unblocked while still
// protecting prod when the env vars are configured in Vercel.
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

function makeLimiter(requests: number, window: `${number} ${"s" | "m" | "h"}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: "rendall:rl",
  });
}

// Per-IP limiters tuned for typical human + low-volume bot traffic. Tighten
// if abuse is observed in Upstash analytics.
export const limiters = {
  // 5 checkout creations / minute / IP — humans rarely click checkout >5x/min
  checkout: makeLimiter(5, "1 m"),
  // 10 auth page hits / minute / IP — slows scripts that scrape login pages
  auth: makeLimiter(10, "1 m"),
  // 5 login attempts / minute / IP — humans don't typo their password 5x/min;
  // bots brute-forcing credentials get throttled hard
  loginAttempt: makeLimiter(5, "1 m"),
  // 3 signups / hour / IP — signups are rare; this caps account-creation spam
  signupAttempt: makeLimiter(3, "1 h"),
  // 60 API calls / minute / IP — generic catch-all for /api/*
  api: makeLimiter(60, "1 m"),
};

// Best-effort client IP from common proxy headers. Falls back to a constant
// so in-cluster traffic still gets a counter (won't bucket per-attacker but
// at least caps total volume).
export function getClientIp(req: NextRequest | Request): string {
  const headers = "headers" in req ? req.headers : new Headers();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "anonymous";
}

// Convenience: check a limiter and return null if allowed, or a Response if
// rate-limited. Callers should `return result` early when non-null.
export async function enforce(
  limiter: Ratelimit | null,
  identifier: string
): Promise<Response | null> {
  if (!limiter) return null;
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  if (success) return null;
  return new Response(
    JSON.stringify({ error: "Too many requests" }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
      },
    }
  );
}
