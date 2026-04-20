import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProductById } from "@/lib/products";
import { isValidCountryCode } from "@/lib/countries";

export const runtime = "nodejs";

type ShippingInput = {
  name: string;
  line1: string;
  city: string;
  state: string;
  country: string;
  postal: string;
  phone: string;
};

const PHONE_RE = /^[+0-9()\- ]{5,25}$/;

function nonEmpty(s: unknown, max: number): s is string {
  return typeof s === "string" && s.trim().length > 0 && s.length <= max;
}

function validateShipping(input: unknown): { ok: true; value: ShippingInput } | { ok: false; reason: string } {
  if (!input || typeof input !== "object") return { ok: false, reason: "shipping missing" };
  const s = input as Record<string, unknown>;
  if (!nonEmpty(s.name, 120)) return { ok: false, reason: "name required" };
  if (!nonEmpty(s.line1, 200)) return { ok: false, reason: "address required" };
  if (!nonEmpty(s.city, 120)) return { ok: false, reason: "city required" };
  if (!nonEmpty(s.state, 120)) return { ok: false, reason: "state/province required" };
  if (typeof s.country !== "string" || !isValidCountryCode(s.country)) {
    return { ok: false, reason: "country must be a supported ISO-2 code" };
  }
  if (!nonEmpty(s.postal, 20)) return { ok: false, reason: "postal code required" };
  if (typeof s.phone !== "string" || !PHONE_RE.test(s.phone)) {
    return { ok: false, reason: "phone invalid" };
  }
  return {
    ok: true,
    value: {
      name: (s.name as string).trim(),
      line1: (s.line1 as string).trim(),
      city: (s.city as string).trim(),
      state: (s.state as string).trim(),
      country: s.country,
      postal: (s.postal as string).trim(),
      phone: (s.phone as string).trim(),
    },
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const shippingResult = validateShipping(body?.shipping);
  if (!shippingResult.ok) {
    return Response.json({ error: shippingResult.reason }, { status: 400 });
  }
  const shipping = shippingResult.value;

  const { data: cartItems, error: cartErr } = await supabase
    .from("cart_items")
    .select("id, design_id, quantity, size, color, design:designs(product_id, name)")
    .eq("user_id", user.id);

  if (cartErr) {
    return Response.json({ error: cartErr.message }, { status: 500 });
  }
  if (!cartItems || cartItems.length === 0) {
    return Response.json({ error: "cart is empty" }, { status: 400 });
  }

  let totalCents = 0;
  const orderItemRows: Array<{
    design_id: string;
    product_name: string;
    quantity: number;
    size: string;
    color: string;
    unit_price_cents: number;
  }> = [];

  for (const ci of cartItems) {
    const design = Array.isArray(ci.design) ? ci.design[0] : ci.design;
    if (!design) {
      return Response.json({ error: `cart item ${ci.id} references a missing design` }, { status: 400 });
    }
    const product = getProductById(design.product_id);
    if (!product) {
      return Response.json({ error: `unknown product ${design.product_id}` }, { status: 400 });
    }
    const unit = product.priceCents;
    const qty = Math.max(1, ci.quantity | 0);
    totalCents += unit * qty;
    orderItemRows.push({
      design_id: ci.design_id,
      product_name: product.name,
      quantity: qty,
      size: ci.size,
      color: ci.color,
      unit_price_cents: unit,
    });
  }

  // Use the admin client for the insert so we can set cart_item_ids with the
  // authoritative server-side list. The order's RLS policy only permits the
  // owning user to read, so public exposure is unchanged.
  const admin = createAdminClient();
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total_cents: totalCents,
      shipping_address: shipping,
      cart_item_ids: cartItems.map((c) => c.id),
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return Response.json({ error: orderErr?.message ?? "order insert failed" }, { status: 500 });
  }

  const { error: itemsErr } = await admin
    .from("order_items")
    .insert(orderItemRows.map((r) => ({ ...r, order_id: order.id })));

  if (itemsErr) {
    // Roll back the order so we don't accumulate orphans.
    await admin.from("orders").delete().eq("id", order.id);
    return Response.json({ error: itemsErr.message }, { status: 500 });
  }

  return Response.json({ order_id: order.id });
}
