import { airwallexFetch } from "./client";

export type PaymentIntentStatus =
  | "REQUIRES_PAYMENT_METHOD"
  | "REQUIRES_CUSTOMER_ACTION"
  | "REQUIRES_CAPTURE"
  | "SUCCEEDED"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentIntent = {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  merchant_order_id?: string;
  request_id?: string;
  metadata?: Record<string, string>;
};

type CreateParams = {
  /** Amount in cents (Rendall internal convention). Converted to decimal for Airwallex. */
  amount: number;
  currency: string;
  merchantOrderId: string;
  requestId: string;
  returnUrl?: string;
  metadata?: Record<string, string>;
};

// Airwallex accepts decimal amounts with currency-aware precision. USD/EUR use
// 2 decimals; keep the conversion centralized here so the rest of the codebase
// stays in cents. Revisit if we ever charge in JPY/KRW (0 decimals) or BHD/KWD
// (3 decimals).
function centsToDecimal(cents: number): number {
  return Math.round(cents) / 100;
}

export async function createPaymentIntent(params: CreateParams): Promise<PaymentIntent> {
  const amount = centsToDecimal(params.amount);
  return airwallexFetch<PaymentIntent>("/api/v1/pa/payment_intents/create", {
    method: "POST",
    body: {
      request_id: params.requestId,
      amount,
      currency: params.currency,
      merchant_order_id: params.merchantOrderId,
      return_url: params.returnUrl,
      metadata: params.metadata,
    },
  });
}

export async function getPaymentIntent(id: string): Promise<PaymentIntent> {
  return airwallexFetch<PaymentIntent>(
    `/api/v1/pa/payment_intents/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
}
