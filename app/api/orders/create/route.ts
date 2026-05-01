import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProductById } from "@/lib/products";
import { isValidCountryCode } from "@/lib/countries";
import { enforce, getClientIp, limiters } from "@/lib/ratelimit";

export const runtime = "nodejs";

type RecipientAddress = {
  name: string;
  line1: string;
  city: string;
  state: string;
  country: string;
  postal: string;
  phone: string;
};

type RecipientInput = RecipientAddress & {
  cart_item_id: string;
  size: string;
  color: string;
  quantity: number;
};

const PHONE_RE = /^[+0-9()\- ]{5,25}$/;
// Hard cap to prevent runaway batches. 500 still leaves plenty of headroom
// for any realistic bulk drop.
const MAX_RECIPIENTS = 500;

function nonEmpty(s: unknown, max: number): s is string {
  return typeof s === "string" && s.trim().length > 0 && s.length <= max;
}

function validateRecipient(input: unknown, idx: number): { ok: true; value: RecipientInput } | { ok: false; reason: string } {
  if (!input || typeof input !== "object") return { ok: false, reason: `recipient ${idx + 1}: missing` };
  const r = input as Record<string, unknown>;
  const where = `recipient ${idx + 1}`;
  if (!nonEmpty(r.cart_item_id, 64)) return { ok: false, reason: `${where}: cart_item_id required` };
  if (!nonEmpty(r.name, 120)) return { ok: false, reason: `${where}: name required` };
  if (!nonEmpty(r.line1, 200)) return { ok: false, reason: `${where}: address required` };
  if (!nonEmpty(r.city, 120)) return { ok: false, reason: `${where}: city required` };
  if (!nonEmpty(r.state, 120)) return { ok: false, reason: `${where}: state/province required` };
  if (typeof r.country !== "string" || !isValidCountryCode(r.country)) {
    return { ok: false, reason: `${where}: country must be a supported ISO-2 code` };
  }
  if (!nonEmpty(r.postal, 20)) return { ok: false, reason: `${where}: postal code required` };
  if (typeof r.phone !== "string" || !PHONE_RE.test(r.phone)) {
    return { ok: false, reason: `${where}: phone invalid` };
  }
  if (!nonEmpty(r.size, 32)) return { ok: false, reason: `${where}: size required` };
  if (!nonEmpty(r.color, 64)) return { ok: false, reason: `${where}: color required` };
  const qtyNum = typeof r.quantity === "number" ? r.quantity : Number(r.quantity);
  if (!Number.isFinite(qtyNum) || qtyNum < 1 || qtyNum > 1000) {
    return { ok: false, reason: `${where}: quantity must be 1-1000` };
  }
  return {
    ok: true,
    value: {
      cart_item_id: (r.cart_item_id as string).trim(),
      name: (r.name as string).trim(),
      line1: (r.line1 as string).trim(),
      city: (r.city as string).trim(),
      state: (r.state as string).trim(),
      country: r.country,
      postal: (r.postal as string).trim(),
      phone: (r.phone as string).trim(),
      size: (r.size as string).trim(),
      color: (r.color as string).trim(),
      quantity: Math.floor(qtyNum),
    },
  };
}

export async function POST(request: NextRequest) {
  const limited = await enforce(limiters.checkout, `orders-create:${getClientIp(request)}`);
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawRecipients = body?.recipients;
  if (!Array.isArray(rawRecipients) || rawRecipients.length === 0) {
    return Response.json({ error: "recipients array required" }, { status: 400 });
  }
  if (rawRecipients.length > MAX_RECIPIENTS) {
    return Response.json({ error: `max ${MAX_RECIPIENTS} recipients per order` }, { status: 400 });
  }

  const recipients: RecipientInput[] = [];
  for (let i = 0; i < rawRecipients.length; i++) {
    const result = validateRecipient(rawRecipients[i], i);
    if (!result.ok) {
      return Response.json({ error: result.reason }, { status: 400 });
    }
    recipients.push(result.value);
  }

  // We do NOT fetch design_config or image_url here. Both are populated
  // onto each order_items row by the BEFORE INSERT trigger added in
  // migration 015 (copy_design_snapshot_to_order_item). That keeps the
  // multi-MB jsonb server-side — fetching it through Node here trips the
  // Supabase statement timeout for image-heavy designs.
  const { data: cartItems, error: cartErr } = await supabase
    .from("cart_items")
    .select("id, design_id, design:designs(product_id, name)")
    .eq("user_id", user.id);

  if (cartErr) {
    return Response.json({ error: cartErr.message }, { status: 500 });
  }
  if (!cartItems || cartItems.length === 0) {
    return Response.json({ error: "cart is empty" }, { status: 400 });
  }

  const cartById = new Map(cartItems.map((c) => [c.id, c]));

  let totalCents = 0;
  const orderItemRows: Array<{
    design_id: string;
    product_name: string;
    quantity: number;
    size: string;
    color: string;
    unit_price_cents: number;
    product_id_snapshot: string;
    recipient_address: RecipientAddress;
  }> = [];

  for (const r of recipients) {
    const ci = cartById.get(r.cart_item_id);
    if (!ci) {
      return Response.json({ error: `cart item ${r.cart_item_id} not in your cart` }, { status: 400 });
    }
    const design = Array.isArray(ci.design) ? ci.design[0] : ci.design;
    if (!design) {
      return Response.json({ error: `cart item ${ci.id} references a missing design` }, { status: 400 });
    }
    const product = getProductById(design.product_id);
    if (!product) {
      return Response.json({ error: `unknown product ${design.product_id}` }, { status: 400 });
    }
    const unit = product.priceCents;
    totalCents += unit * r.quantity;
    orderItemRows.push({
      design_id: ci.design_id,
      product_name: product.name,
      quantity: r.quantity,
      size: r.size,
      color: r.color,
      unit_price_cents: unit,
      product_id_snapshot: design.product_id,
      recipient_address: {
        name: r.name,
        line1: r.line1,
        city: r.city,
        state: r.state,
        country: r.country,
        postal: r.postal,
        phone: r.phone,
      },
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
      // Primary contact = first recipient. Used as fallback for legacy code
      // paths and as a sensible "who is this order for" header in admin.
      shipping_address: orderItemRows[0].recipient_address,
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
