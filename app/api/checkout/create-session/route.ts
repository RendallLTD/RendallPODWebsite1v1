import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { getProductById } from "@/lib/products";

export const runtime = "nodejs";

// Shape of the joined cart row we read from Supabase. `design` may be an
// object or null depending on whether the designs row still exists.
type CartRow = {
  id: string;
  quantity: number | null;
  size: string | null;
  color: string | null;
  design: {
    id: string;
    name: string | null;
    product_id: string;
    image_url: string | null;
  } | null;
};

// Extract the line-item param type directly from the SDK's create() signature.
// Avoids the Stripe.Checkout.SessionCreateParams namespace-merge pitfall in
// the installed type bundle.
type CheckoutLineItem = NonNullable<
  Parameters<typeof stripe.checkout.sessions.create>[0]
>["line_items"] extends (infer T)[] | undefined
  ? T
  : never;

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { data: cartRows, error: cartErr } = await supabase
      .from("cart_items")
      .select(
        "id, quantity, size, color, design:designs(id, name, product_id, image_url)"
      )
      .eq("user_id", user.id)
      .returns<CartRow[]>();

    if (cartErr) {
      console.error("[checkout] failed to load cart", cartErr);
      return Response.json(
        { error: "Checkout session creation failed" },
        { status: 500 }
      );
    }

    if (!cartRows || cartRows.length === 0) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Build Stripe line items. Prices are ALWAYS recomputed server-side from
    // lib/products.ts — we do not trust anything price-like from the cart row.
    const lineItems: CheckoutLineItem[] = [];
    for (const row of cartRows) {
      if (!row.design) {
        return Response.json(
          { error: "Cart contains a deleted design" },
          { status: 400 }
        );
      }
      const product = getProductById(row.design.product_id);
      if (!product) {
        return Response.json(
          { error: "Cart contains an unknown product" },
          { status: 400 }
        );
      }
      const quantity = row.quantity ?? 0;
      if (quantity <= 0) {
        return Response.json(
          { error: "Cart contains an invalid quantity" },
          { status: 400 }
        );
      }

      const variant = [row.size, row.color].filter(Boolean).join(" / ");

      // Stripe's product_data has hard limits: name ≤ 250 chars, description
      // ≤ 500 chars, and images must be real URLs (not data: URLs). Designs in
      // this app sometimes store base64 data URLs in image_url or name, which
      // blow past Stripe's ~4MB request body limit (HTTP 413). Defensively
      // sanitize all three fields before sending.
      const rawName = row.design.name ?? "";
      const safeName =
        rawName && !rawName.startsWith("data:") && rawName.length < 200
          ? rawName
          : "Custom design";

      const rawDescription = variant
        ? `${product.name} — ${variant}`
        : product.name;
      const safeDescription = rawDescription.slice(0, 500);

      const imageUrl = row.design.image_url ?? "";
      const images =
        imageUrl.startsWith("http://") || imageUrl.startsWith("https://")
          ? [imageUrl]
          : undefined;

      lineItems.push({
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: product.priceCents,
          product_data: {
            name: safeName,
            description: safeDescription,
            images,
          },
        },
      });
    }

    // Telemetry: log the approximate payload size so we can diagnose future
    // 413s. A normal cart should be < 5 KB here.
    console.log(
      "[checkout] line_items payload size",
      JSON.stringify(lineItems).length,
      "bytes across",
      lineItems.length,
      "items"
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      throw new Error("NEXT_PUBLIC_SITE_URL is not set");
    }

    // ========================================================================
    // Draft-order-first: create a pending `orders` row + full `order_items`
    // with design_id/size/color BEFORE redirecting to Stripe. The webhook's
    // job is then just to flip pending → paid and delete the snapshotted
    // cart_items. Closes Codex Findings 1, 2, 3 (2026-04-11).
    // ========================================================================
    const admin = createAdminClient();

    const cartItemIds = cartRows.map((r) => r.id).sort();
    const totalCents = lineItems.reduce(
      (sum, li) =>
        sum + (li.price_data?.unit_amount ?? 0) * (li.quantity ?? 0),
      0
    );

    // ========================================================================
    // Idempotency: reuse an existing pending draft for the same user + cart
    // snapshot + total within 30 min. Prevents duplicate drafts on double-
    // click, multi-tab, or network retry. Closes Codex Finding A (Review #3).
    // ========================================================================
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existingDrafts } = await admin
      .from("orders")
      .select("id, checkout_url, cart_item_ids")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .eq("total_cents", totalCents)
      .contains("cart_item_ids", cartItemIds)
      .gte("created_at", thirtyMinAgo);

    const reusable = existingDrafts?.find(
      (d) =>
        d.checkout_url &&
        d.cart_item_ids &&
        d.cart_item_ids.length === cartItemIds.length
    );

    if (reusable) {
      console.log(
        "[checkout] reusing existing draft",
        reusable.id,
        "— idempotent retry"
      );
      return Response.json({ url: reusable.checkout_url });
    }

    const { data: draftOrder, error: draftErr } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        total_cents: totalCents,
        cart_item_ids: cartItemIds,
      })
      .select("id")
      .single();

    if (draftErr || !draftOrder) {
      console.error("[checkout] failed to create draft order", draftErr);
      return Response.json(
        { error: "Checkout session creation failed" },
        { status: 500 }
      );
    }

    const draftItems = cartRows.map((row) => {
      // Non-null asserts: we validated row.design and the product earlier in
      // the loop; any row that reached this point has both present.
      const product = getProductById(row.design!.product_id)!;
      const variant = [row.size, row.color].filter(Boolean).join(" / ");
      return {
        order_id: draftOrder.id,
        design_id: row.design!.id,
        product_name: variant ? `${product.name} — ${variant}` : product.name,
        quantity: row.quantity ?? 1,
        unit_price_cents: product.priceCents,
        size: row.size,
        color: row.color,
      };
    });

    const { error: itemsErr } = await admin
      .from("order_items")
      .insert(draftItems);
    if (itemsErr) {
      // Roll back the draft order on failure so we don't leak pending rows.
      await admin.from("orders").delete().eq("id", draftOrder.id);
      console.error("[checkout] failed to create draft order_items", itemsErr);
      return Response.json(
        { error: "Checkout session creation failed" },
        { status: 500 }
      );
    }

    let session: Awaited<
      ReturnType<typeof stripe.checkout.sessions.create>
    >;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: lineItems,
        shipping_address_collection: { allowed_countries: ["US"] },
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/cart`,
        client_reference_id: user.id,
        metadata: { user_id: user.id, order_id: draftOrder.id },
        customer_email: user.email,
      });
    } catch (err) {
      // Roll back the draft order (cascades to order_items) if Stripe fails.
      await admin.from("orders").delete().eq("id", draftOrder.id);
      throw err;
    }

    if (!session.url) {
      await admin.from("orders").delete().eq("id", draftOrder.id);
      throw new Error("Stripe session created without a redirect URL");
    }

    // Persist Stripe session details on the draft so future retries can
    // reuse this session instead of minting a new one (Finding A).
    await admin
      .from("orders")
      .update({
        stripe_session_id: session.id,
        checkout_url: session.url,
      })
      .eq("id", draftOrder.id);

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] create-session failed", err);
    return Response.json(
      { error: "Checkout session creation failed" },
      { status: 500 }
    );
  }
}
