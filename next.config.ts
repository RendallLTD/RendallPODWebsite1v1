import type { NextConfig } from "next";

// Airwallex Drop-in loads the SDK bundle from static(-demo).airwallex.com,
// phones telemetry home to o11y(-demo).airwallex.com, and mounts PCI-scoped
// card fields in iframes under checkout(-demo).airwallex.com. Whitelist the
// wildcard so both demo and prod work without env-specific config.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.airwallex.com",
  "style-src 'self' 'unsafe-inline' https://*.airwallex.com",
  "img-src 'self' data: blob: https://*.supabase.co https://*.airwallex.com https://*.r2.dev https://*.r2.cloudflarestorage.com",
  "font-src 'self' data: https://*.airwallex.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.airwallex.com https://*.r2.dev https://*.r2.cloudflarestorage.com",
  "frame-src https://*.airwallex.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
