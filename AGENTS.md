<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Server-only libraries

- `sharp` (image compositing for print + mockup files) is a native module. Only import it from files under `app/api/**`, `lib/render/**`, or other server-only code paths. Never import it from a client component — it will crash the browser bundle.
- `exceljs` (XLSX generation) is also server-only in this codebase — keep imports inside `app/api/**` or `lib/xlsx/**`.
- `resend` (email) lives server-side too; the API key is in `RESEND_API_KEY` and must never ship to the client.
