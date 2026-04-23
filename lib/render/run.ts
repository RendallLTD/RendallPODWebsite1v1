import { createAdminClient } from "@/lib/supabase/admin";
import { getProductById, getDesignerPhoto } from "@/lib/products";
import { isV2, type DesignConfigV2 } from "@/lib/design-schema";
import { renderPrintPng } from "./print";
import { renderMockupPng } from "./mockup";
import { uploadPng } from "./storage";

export type RenderResult = {
  order_item_id: string;
  print_url_front?: string;
  mockup_url_front?: string;
};

export type SkipResult = { order_item_id: string; reason: string };

export async function renderOrderItems(
  itemIds: string[],
): Promise<{ rendered: RenderResult[]; skipped: SkipResult[] }> {
  const admin = createAdminClient();

  const { data: items, error } = await admin
    .from("order_items")
    .select("id, order_id, design_id, color, designs:design_id(product_id, design_config)")
    .in("id", itemIds);

  if (error || !items) {
    return { rendered: [], skipped: itemIds.map((id) => ({ order_item_id: id, reason: error?.message ?? "load failed" })) };
  }

  const rendered: RenderResult[] = [];
  const skipped: SkipResult[] = [];

  for (const item of items) {
    const designRow = Array.isArray(item.designs) ? item.designs[0] : item.designs;
    if (!designRow) {
      skipped.push({ order_item_id: item.id, reason: "design missing" });
      continue;
    }

    const cfg = designRow.design_config as unknown;
    if (!isV2(cfg)) {
      skipped.push({ order_item_id: item.id, reason: "design_config not v2" });
      continue;
    }
    const config = cfg as DesignConfigV2;

    const frontLayers = config.sides?.front;
    if (!frontLayers || frontLayers.length === 0) {
      skipped.push({ order_item_id: item.id, reason: "no front layers" });
      continue;
    }

    const product = getProductById(designRow.product_id);
    const printSpec = product?.measurements?.printSpecs?.front;
    if (!product || !printSpec) {
      skipped.push({ order_item_id: item.id, reason: "product or printSpec missing" });
      continue;
    }

    const photoPath = getDesignerPhoto(product, "front", item.color ?? product.colors[0]);
    if (!photoPath) {
      skipped.push({ order_item_id: item.id, reason: "photo missing" });
      continue;
    }

    try {
      const printBuf = await renderPrintPng({ printSpec, layers: frontLayers });
      const printKey = `prints/${item.order_id}/${item.id}/front.png`;
      const printUrl = await uploadPng(printKey, printBuf);

      const mockupBuf = await renderMockupPng({
        productPhotoPath: photoPath,
        printSpec,
        layers: frontLayers,
      });
      const mockupKey = `mockups/${item.order_id}/${item.id}/front.png`;
      const mockupUrl = await uploadPng(mockupKey, mockupBuf);

      const { error: updateErr } = await admin
        .from("order_items")
        .update({ print_url_front: printUrl, mockup_url_front: mockupUrl })
        .eq("id", item.id);
      if (updateErr) throw updateErr;

      rendered.push({
        order_item_id: item.id,
        print_url_front: printUrl,
        mockup_url_front: mockupUrl,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      skipped.push({ order_item_id: item.id, reason: `render failed: ${msg}` });
    }
  }

  return { rendered, skipped };
}

export async function renderOrderItemsForOrder(orderId: string): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("order_items")
    .select("id")
    .eq("order_id", orderId);
  if (error || !data || data.length === 0) {
    if (error) console.error("[auto-render] failed to load items", { orderId, error });
    return;
  }
  const { skipped } = await renderOrderItems(data.map((r) => r.id));
  if (skipped.length > 0) {
    console.warn("[auto-render] some items skipped", { orderId, skipped });
  }
}
