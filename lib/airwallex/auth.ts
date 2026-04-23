import { BASE_URL } from "./env";

type CachedToken = { token: string; expiresAt: number };

let cached: CachedToken | null = null;
let inflight: Promise<string> | null = null;

const REFRESH_BUFFER_MS = 5 * 60 * 1000;

async function fetchToken(): Promise<CachedToken> {
  const clientId = process.env.AIRWALLEX_CLIENT_ID;
  const apiKey = process.env.AIRWALLEX_API_KEY;
  if (!clientId || !apiKey) {
    throw new Error("AIRWALLEX_CLIENT_ID / AIRWALLEX_API_KEY are not set.");
  }

  const res = await fetch(`${BASE_URL}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
    // No body required — credentials are in headers. Send an empty JSON object
    // to avoid some proxies stripping zero-length POSTs.
    body: "{}",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Airwallex auth failed: ${res.status} ${res.statusText} — ${body}`,
    );
  }

  const json = (await res.json()) as { token: string; expires_at: string };
  const expiresAt = new Date(json.expires_at).getTime();
  if (!json.token || !Number.isFinite(expiresAt)) {
    throw new Error(`Airwallex auth returned unexpected shape: ${JSON.stringify(json)}`);
  }
  return { token: json.token, expiresAt };
}

export async function getBearerToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt - REFRESH_BUFFER_MS > now) {
    return cached.token;
  }
  if (inflight) return inflight;
  inflight = fetchToken()
    .then((t) => {
      cached = t;
      return t.token;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

// Exposed for tests / forced refresh after a 401 (future use).
export function clearTokenCache() {
  cached = null;
}
