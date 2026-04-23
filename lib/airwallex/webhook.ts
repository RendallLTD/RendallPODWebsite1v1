import { createHmac, timingSafeEqual } from "node:crypto";

// Airwallex webhook signing (per docs: Developer Tools → Webhooks → Listen for
// webhook events): each request includes `x-timestamp` and `x-signature`
// headers. The signature is HMAC-SHA256 over the concatenation
// `${timestamp}${rawBody}` using the webhook's signing secret, hex-encoded.
//
// NOTE: if Airwallex ever changes the scheme (e.g. introduces a `.` separator
// or a versioned signature like `t=...,v1=...`), this is the single spot to
// adjust. Verify headers + format in a sandbox ping before going live.

const MAX_SKEW_MS = 5 * 60 * 1000;

export type WebhookHeaders = {
  timestamp: string | null;
  signature: string | null;
};

export function readWebhookHeaders(headers: Headers): WebhookHeaders {
  return {
    timestamp: headers.get("x-timestamp"),
    signature: headers.get("x-signature"),
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  headers: WebhookHeaders,
  secret: string,
): boolean {
  if (!headers.timestamp || !headers.signature || !secret) return false;

  const tsMs = Number(headers.timestamp);
  // Airwallex may send seconds or milliseconds; accept either by normalizing.
  const tsAsMs = tsMs < 1e12 ? tsMs * 1000 : tsMs;
  if (!Number.isFinite(tsAsMs)) return false;
  if (Math.abs(Date.now() - tsAsMs) > MAX_SKEW_MS) return false;

  const expected = createHmac("sha256", secret)
    .update(`${headers.timestamp}${rawBody}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(headers.signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
