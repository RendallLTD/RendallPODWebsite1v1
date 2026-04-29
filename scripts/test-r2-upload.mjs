#!/usr/bin/env node
// Local smoke test for the R2 upload path. Mints a presigned URL via the
// running dev server, PUTs a 50MB random buffer, fetches the public URL,
// and verifies the bytes match.
//
// Prereq: `npm run dev` is running on localhost:3000, you are logged in in
// a browser, and you have copied the `sb-` cookie value from devtools into
// the SUPABASE_COOKIE env var below.
//
// Usage:
//   SUPABASE_COOKIE='sb-...=...; sb-...=...' node scripts/test-r2-upload.mjs

import { randomBytes } from "node:crypto";

const ORIGIN = process.env.RENDALL_ORIGIN ?? "http://localhost:3000";
const COOKIE = process.env.SUPABASE_COOKIE;

if (!COOKIE) {
  console.error("SUPABASE_COOKIE env var required (paste your browser cookie header)");
  process.exit(2);
}

// Build a 50MB PNG-shaped buffer: real PNG header + random padding so
// magic-byte detection passes and content-length matches the cap.
const size = 50 * 1024 * 1024;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  randomBytes(size - 8),
]);

console.log(`[1/4] requesting presign for ${size} bytes...`);
const signRes = await fetch(`${ORIGIN}/api/uploads/sign`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie: COOKIE,
  },
  body: JSON.stringify({ contentType: "image/png", contentLength: size }),
});
if (!signRes.ok) {
  console.error(`presign failed: ${signRes.status} ${await signRes.text()}`);
  process.exit(1);
}
const { uploadUrl, publicUrl, key } = await signRes.json();
console.log(`     key = ${key}`);

console.log(`[2/4] PUT to R2...`);
const putRes = await fetch(uploadUrl, {
  method: "PUT",
  headers: { "content-type": "image/png" },
  body: png,
});
if (!putRes.ok) {
  console.error(`PUT failed: ${putRes.status} ${await putRes.text()}`);
  process.exit(1);
}

console.log(`[3/4] GET public URL...`);
const getRes = await fetch(publicUrl);
if (!getRes.ok) {
  console.error(`GET failed: ${getRes.status}`);
  process.exit(1);
}
const got = Buffer.from(await getRes.arrayBuffer());

console.log(`[4/4] verify bytes...`);
if (got.byteLength !== size) {
  console.error(`size mismatch: got ${got.byteLength}, expected ${size}`);
  process.exit(1);
}
if (got[0] !== 0x89 || got[1] !== 0x50) {
  console.error(`magic-byte mismatch: ${got.slice(0, 4).toString("hex")}`);
  process.exit(1);
}

console.log("PASS — 50MB roundtrip via R2 succeeded.");
console.log(`Public URL: ${publicUrl}`);
