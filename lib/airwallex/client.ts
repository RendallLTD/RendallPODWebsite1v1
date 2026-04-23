import { BASE_URL } from "./env";
import { getBearerToken } from "./auth";

export class AirwallexApiError extends Error {
  status: number;
  code?: string;
  raw: string;
  constructor(status: number, message: string, raw: string, code?: string) {
    super(message);
    this.name = "AirwallexApiError";
    this.status = status;
    this.raw = raw;
    this.code = code;
  }
}

export async function airwallexFetch<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<T> {
  const token = await getBearerToken();
  const headers = new Headers(init.headers as HeadersInit | undefined);
  headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (init.body !== undefined && init.body !== null) {
    if (typeof init.body === "string" || init.body instanceof FormData) {
      body = init.body as BodyInit;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(init.body);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    body,
  });

  const raw = await res.text();
  if (!res.ok) {
    let code: string | undefined;
    let message = `${res.status} ${res.statusText}`;
    try {
      const parsed = JSON.parse(raw) as { code?: string; message?: string };
      code = parsed.code;
      if (parsed.message) message = parsed.message;
    } catch {
      // non-JSON body — leave defaults
    }
    throw new AirwallexApiError(res.status, message, raw, code);
  }

  if (!raw) return undefined as T;
  return JSON.parse(raw) as T;
}
