import { createHmac, timingSafeEqual } from "node:crypto";

// HMAC-signed bearer URLs for the factory ZIP endpoint. Factory partners are
// not signed-in users, so we mint long-lived signed URLs at XLSX export time
// and validate exp+sig on the route. Rotating FACTORY_URL_SIGNING_SECRET
// invalidates all previously-issued URLs, which is the revoke story.

function getSecret(): string {
  const s = process.env.FACTORY_URL_SIGNING_SECRET;
  if (!s || s.length < 32) {
    throw new Error("FACTORY_URL_SIGNING_SECRET missing or too short (need >= 32 chars)");
  }
  return s;
}

function sign(itemId: string, exp: number): string {
  return createHmac("sha256", getSecret())
    .update(`${itemId}.${exp}`)
    .digest("base64url");
}

export function signFactoryItemUrl(
  itemId: string,
  ttlSeconds: number,
  baseUrl: string,
): { url: string; exp: number; sig: string } {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = sign(itemId, exp);
  const url = `${baseUrl}/api/factory-files/${itemId}/files.zip?exp=${exp}&sig=${sig}`;
  return { url, exp, sig };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "expired" };

export function verifyFactoryItemSignature(params: {
  itemId: string;
  exp: string | null;
  sig: string | null;
}): VerifyResult {
  if (!params.exp || !params.sig) return { ok: false, reason: "missing" };
  const expNum = Number(params.exp);
  if (!Number.isFinite(expNum)) return { ok: false, reason: "invalid" };

  const expected = sign(params.itemId, expNum);
  // Buffers must be equal length for timingSafeEqual; mismatched length is by
  // definition not equal, so fail fast.
  const a = Buffer.from(expected);
  const b = Buffer.from(params.sig);
  if (a.length !== b.length) return { ok: false, reason: "invalid" };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: "invalid" };

  if (Math.floor(Date.now() / 1000) > expNum) return { ok: false, reason: "expired" };
  return { ok: true };
}
