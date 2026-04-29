// Dual-read helper for layer images. New designs reference an HTTPS URL in
// R2; legacy designs (pre-2026-04-29) embedded a base64 data URL directly in
// design_config. Renderers call this and don't care which form they get.

const FETCH_TIMEOUT_MS = 15_000;
// Slack above the 50MB client cap so a slightly-rounded content-length on a
// near-cap image still passes. Anything above this is a sign of abuse or
// corruption — refuse rather than buffer the bytes.
const MAX_BYTES = 60 * 1024 * 1024;

function decodeDataUrl(src: string): Buffer {
  const comma = src.indexOf(",");
  const b64 = comma >= 0 ? src.slice(comma + 1) : src;
  return Buffer.from(b64, "base64");
}

export async function fetchImageBuffer(src: string): Promise<Buffer> {
  if (src.startsWith("data:")) {
    return decodeDataUrl(src);
  }
  if (src.startsWith("https://") || src.startsWith("http://")) {
    const res = await fetch(src, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      throw new Error(`fetchImageBuffer: ${res.status} ${res.statusText} for ${src}`);
    }
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) {
      throw new Error(`fetchImageBuffer: image too large (${len} bytes) at ${src}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(`fetchImageBuffer: image too large (${buf.byteLength} bytes) at ${src}`);
    }
    return buf;
  }
  throw new Error(`fetchImageBuffer: unsupported image source: ${src.slice(0, 32)}...`);
}
