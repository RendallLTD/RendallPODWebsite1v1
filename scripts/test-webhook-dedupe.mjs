// Live test of the Airwallex webhook idempotency path.
//
// Signs and posts the same fake event twice. Expects:
//   1st call -> 200 "ok"        (event logged for the first time)
//   2nd call -> 200 "duplicate" (PK constraint hit, route returns duplicate)
//
// Usage:
//   node scripts/test-webhook-dedupe.mjs
//
// Loads AIRWALLEX_WEBHOOK_SECRET from .env.local in the rendall-pod root.
// Optional env: WEBHOOK_URL (default http://localhost:3000/api/webhooks/airwallex)

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "..", ".env.local");
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  console.error(`Could not read ${envPath}`);
  process.exit(1);
}

const url = process.env.WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/airwallex";
const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
if (!secret) {
  console.error("AIRWALLEX_WEBHOOK_SECRET not set in env. Did you pass --env-file=.env.local?");
  process.exit(1);
}

// Use payment_attempt.expired so the route logs the event but does not try to
// resolve an order or call markOrderPaid. We're isolating the dedupe path.
const eventId = `evt_dedupe_test_${Date.now()}`;
const body = JSON.stringify({
  id: eventId,
  name: "payment_attempt.expired",
  data: { object: { id: "int_test", merchant_order_id: null } },
});
const timestamp = String(Date.now());
const signature = createHmac("sha256", secret).update(`${timestamp}${body}`).digest("hex");

async function send(label) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-timestamp": timestamp,
      "x-signature": signature,
    },
    body,
  });
  const text = await res.text();
  console.log(`[${label}] HTTP ${res.status} body=${JSON.stringify(text)}`);
  return { status: res.status, text };
}

console.log(`Posting to ${url}`);
console.log(`Event id: ${eventId}\n`);

const first = await send("first ");
const second = await send("second");

const firstOk = first.status === 200 && first.text !== "duplicate";
const secondDuplicate = second.status === 200 && second.text === "duplicate";

console.log("");
if (firstOk && secondDuplicate) {
  console.log("PASS: dedupe path works (1st=accepted, 2nd=duplicate)");
  process.exit(0);
}
console.log("FAIL: dedupe path did not behave as expected");
console.log({ firstOk, secondDuplicate });
process.exit(1);
