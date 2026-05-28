import { createAdminClient } from "@/lib/supabase/admin";
import { getProductById, getDesignerPhoto } from "@/lib/products";
import { isV2, type DesignConfigV2 } from "@/lib/design-schema";
import { renderPrintPng } from "./print";
import { renderMockupPng } from "./mockup";
import { uploadFactoryPng } from "./storage";

export type RenderResult = {
  order_item_id: string;
  print_url_front?: string;
  mockup_url_front?: string;
  print_url_back?: string;
  mockup_url_back?: string;
};

export type SkipResult = { order_item_id: string; reason: string };

// Sides we know how to persist as DB columns. Anything outside this
// whitelist (e.g. a rogue "sleeve" key from a malformed design_config)
// is skipped so we never attempt an UPDATE with an unknown column name.
const SUPPORTED_SIDES = ["front", "back"] as const;
type SupportedSide = (typeof SUPPORTED_SIDES)[number];

function isSupportedSide(s: string): s is SupportedSide {
  return (SUPPORTED_SIDES as readonly string[]).includes(s);
}

export async function renderOrderItems(
  itemIds: string[],
): Promise<{ rendered: RenderResult[]; skipped: SkipResult[] }> {
  const admin = createAdminClient();

  const { data: items, error } = await admin
    .from("order_items")
    .select("id, order_id, color, design_snapshot, product_id_snapshot")
    .in("id", itemIds);

  if (error || !items) {
    return { rendered: [], skipped: itemIds.map((id) => ({ order_item_id: id, reason: error?.message ?? "load failed" })) };
  }

  const rendered: RenderResult[] = [];
  const skipped: SkipResult[] = [];

  for (const item of items) {
    const cfg = item.design_snapshot as unknown;
    if (!isV2(cfg)) {
      skipped.push({ order_item_id: item.id, reason: "design_snapshot not v2" });
      continue;
    }
    const config = cfg as DesignConfigV2;

    const product = getProductById(item.product_id_snapshot);
    if (!product) {
      skipped.push({ order_item_id: item.id, reason: "product missing" });
      continue;
    }

    const perSideSkips: string[] = [];
    const updatePayload: Record<string, string> = {};
    const resultUrls: Partial<RenderResult> = {};

    for (const [side, layers] of Object.entries(config.sides ?? {})) {
      if (!layers || layers.length === 0) continue;

      if (!isSupportedSide(side)) {
        perSideSkips.push(`${side}: side not supported by schema`);
        continue;
      }

      const printSpec = product.measurements?.printSpecs?.[side];
      if (!printSpec) {
        perSideSkips.push(`${side}: printSpec missing`);
        continue;
      }

      const photoPath = getDesignerPhoto(product, side, item.color ?? product.colors[0]);
      if (!photoPath) {
        perSideSkips.push(`${side}: photo missing`);
        continue;
      }

      try {
        const printBuf = await renderPrintPng({ printSpec, layers });
        const printKey = await uploadFactoryPng({
          orderId: item.order_id,
          itemId: item.id,
          kind: "print",
          side,
          buffer: printBuf,
        });

        const mockupBuf = await renderMockupPng({
          productPhotoPath: photoPath,
          printSpec,
          layers,
        });
        const mockupKey = await uploadFactoryPng({
          orderId: item.order_id,
          itemId: item.id,
          kind: "mockup",
          side,
          buffer: mockupBuf,
        });

        // Column still named *_url_* for back-compat; value is an R2 key.
        // Reads go through lib/render/asset-url.ts which detects key vs URL.
        updatePayload[`print_url_${side}`] = printKey;
        updatePayload[`mockup_url_${side}`] = mockupKey;
        resultUrls[`print_url_${side}` as keyof RenderResult] = printKey;
        resultUrls[`mockup_url_${side}` as keyof RenderResult] = mockupKey;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        perSideSkips.push(`${side}: render failed: ${msg}`);
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      const reason = perSideSkips.length > 0
        ? `no renderable sides (${perSideSkips.join("; ")})`
        : "no renderable sides";
      skipped.push({ order_item_id: item.id, reason });
      continue;
    }

    const { error: updateErr } = await admin
      .from("order_items")
      .update(updatePayload)
      .eq("id", item.id);
    if (updateErr) {
      skipped.push({ order_item_id: item.id, reason: `update failed: ${updateErr.message}` });
      continue;
    }

    rendered.push({ order_item_id: item.id, ...resultUrls });

    // Also record per-side render failures on items that partially rendered,
    // so the admin can see which side needs retrying.
    for (const sideReason of perSideSkips) {
      skipped.push({ order_item_id: item.id, reason: sideReason });
    }
  }

  return { rendered, skipped };
}

