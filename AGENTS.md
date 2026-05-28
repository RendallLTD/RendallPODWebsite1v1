<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Server-only libraries

- `sharp` (image compositing for print + mockup files) is a native module. Only import it from files under `app/api/**`, `lib/render/**`, or other server-only code paths. Never import it from a client component — it will crash the browser bundle.
- `exceljs` (XLSX generation) is also server-only in this codebase — keep imports inside `app/api/**` or `lib/xlsx/**`.
- `resend` (email) lives server-side too; the API key is in `RESEND_API_KEY` and must never ship to the client.
- `lib/airwallex/*` is server-only — it hits the Airwallex REST API with the scoped API key and verifies webhook signatures. Never import from a client component.
- `@airwallex/components-sdk` is the opposite: client-only. It's dynamically imported inside `components/checkout/AirwallexDropIn.tsx`; don't import it server-side.
- `lib/r2/*` is server-only — it holds the R2 secret key and mints presigned PUT URLs. Never import from a client component. Browsers upload via the **returned** presigned URL, not by importing this lib.

## Fulfillment hardening (post-Codex)

- **Order item snapshot.** `order_items.design_snapshot` (jsonb), `image_url_snapshot`, `product_id_snapshot` are filled at insert time by a BEFORE INSERT trigger (migration 015). Renderer + factory XLSX/ZIP read from these, never from the live `designs` row. Don't add code that reads `designs.design_config` for paid-order fulfillment.
- **Render queue.** `render_jobs` table is the durable queue (migration 014). `markOrderPaid` enqueues; `app/api/admin/render` is the worker. Failed jobs persist with `last_error` and are re-tryable from the admin Re-render button.
- **Factory ZIP URLs.** Routes under `app/api/factory-files/...` require a valid HMAC sig+exp (`lib/factory-files/sign.ts`). XLSX export emits 30-day signed URLs in column U. Rotating `FACTORY_URL_SIGNING_SECRET` invalidates all outstanding URLs.
- **Webhook idempotency.** `airwallex_webhook_events` (migration 012) is the dedupe boundary. The webhook returns 503 on transient failure (Airwallex retries) and 200 on terminal failure. `scripts/test-webhook-dedupe.mjs` is a regression test for the dedupe path.
- **Image storage (R2).** Two private R2 buckets, sharing one set of credentials (`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`).
  - **`rendall-designs[-dev]`** (`R2_DESIGNS_BUCKET`, public custom domain `R2_PUBLIC_BASE_URL`) — user-uploaded design images. Browsers PUT directly via presigned URLs minted at `/api/uploads/sign`. `MmLayer.image` and `designs.image_url` hold HTTPS URLs. Renderers (`lib/render/print.ts`, `mockup.ts`) call `fetchImageBuffer` which dual-reads URLs and legacy `data:` URLs.
  - **`rendall-factory-exports[-dev]`** (`R2_FACTORY_BUCKET`, **private**, no public domain) — server-rendered print + mockup PNGs. Written by `lib/render/storage.ts` via `serverPutObject`. The R2 **object key** (not a URL) is stored in `order_items.{print,mockup}_url_{front,back}` — column name is back-compat. Treat the value as opaque and always read through `lib/render/asset-url.ts`.
  - **Reads.** `resolveRenderAsset` detects R2 key vs legacy Supabase URL. The factory ZIP route uses `fetchAssetBuffer` (server-side `GetObject` for keys, `fetch` for legacy URLs). Admin "view" links route through `/api/admin/render-asset` which mints a 5-min signed GET. XLSX columns R/S/V/W are **blank for R2-key rows** (factory uses column U signed ZIP exclusively); legacy URLs pass through for older rows.
  - **Legacy bucket.** Supabase `factory-exports` (migration 009) is no longer written to; deprecation noted in migration 018. Drop in a future cleanup once all referenced rows are gone.
