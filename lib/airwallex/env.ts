const raw = process.env.AIRWALLEX_ENV;

if (raw !== "demo" && raw !== "prod") {
  throw new Error(
    `AIRWALLEX_ENV must be "demo" or "prod" (got ${JSON.stringify(raw)}).`,
  );
}

export const ENV_LABEL: "demo" | "prod" = raw;
export const IS_DEMO = raw === "demo";
export const BASE_URL = IS_DEMO
  ? "https://api-demo.airwallex.com"
  : "https://api.airwallex.com";
