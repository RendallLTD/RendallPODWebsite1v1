import { presignGet, getObjectBuffer } from "@/lib/r2/client";
import { getFactoryBucket } from "@/lib/r2/factory-keys";

// `order_items.{print,mockup}_url_*` is a polymorphic string column post-R2-
// migration (2026-05-28): new rows store an R2 object key, pre-migration rows
// store a full https Supabase URL. This module is the single boundary that
// interprets either form. Do not consume the column directly anywhere else —
// always go through one of these helpers.

export type RenderAsset =
  | { kind: "r2-key"; key: string }
  | { kind: "legacy-url"; url: string };

export function resolveRenderAsset(value: string | null | undefined): RenderAsset | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return { kind: "legacy-url", url: value };
  }
  return { kind: "r2-key", key: value };
}

/**
 * Mint a short-lived signed GET URL for an asset stored as an R2 key, or
 * return the legacy Supabase URL unchanged. Returns null if value is null.
 */
export async function signedGetForAsset(
  value: string | null | undefined,
  ttlSeconds: number,
): Promise<string | null> {
  const resolved = resolveRenderAsset(value);
  if (!resolved) return null;
  if (resolved.kind === "legacy-url") return resolved.url;
  return presignGet(getFactoryBucket(), resolved.key, ttlSeconds);
}

/**
 * Fetch the raw bytes of a render asset. R2 keys go through GetObject
 * (server-side, no signed URL needed); legacy URLs go through fetch().
 */
export async function fetchAssetBuffer(
  value: string | null | undefined,
): Promise<Buffer | null> {
  const resolved = resolveRenderAsset(value);
  if (!resolved) return null;
  if (resolved.kind === "r2-key") {
    return getObjectBuffer(getFactoryBucket(), resolved.key);
  }
  const res = await fetch(resolved.url);
  if (!res.ok) return null;
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}
