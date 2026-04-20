import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { getProductById, getDesignerPhoto } from "@/lib/products";
import { isV2, type DesignConfigV2 } from "@/lib/design-schema";
import { renderPrintPng } from "@/lib/render/print";
import { renderMockupPng } from "@/lib/render/mockup";
import { uploadPng } from "@/lib/render/storage";

export const runtime = "nodejs";

type RenderResult = {
  order_item_id: string;
  print_url_front?: string;
  mockup_url_front?: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const itemIds = Array.isArray(body?.order_item_ids) ? body.order_item_ids : null;
  if (!itemIds || itemIds.length === 0) {
    return Response.json({ error: "order_item_ids required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: items, error } = await admin
    .from("order_items")
    .select("id, order_id, design_id, color, designs:design_id(product_id, design_config)")
    .in("id", itemIds);

  if (error || !items) {
    return Response.json({ error: error?.message ?? "load failed" }, { status: 500 });
  }

  const rendered: RenderResult[] = [];
  const skipped: { order_item_id: string; reason: string }[] = [];

  for (const item of items) {
    // Supabase embeds return either an object or array depending on FK cardinality.
    // design_id is a single FK so we expect either null or a single row (possibly wrapped in an array).
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

  return Response.json({ rendered, skipped });
}
