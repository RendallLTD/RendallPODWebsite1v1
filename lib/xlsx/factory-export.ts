import ExcelJS from "exceljs";
import { createAdminClient } from "@/lib/supabase/admin";
import { isV2, type DesignConfigV2 } from "@/lib/design-schema";
import { signFactoryItemUrl } from "@/lib/factory-files/sign";
import { resolveRenderAsset } from "@/lib/render/asset-url";

// Post-2026-05-28: render outputs live in private R2; factory uses column U
// (signed ZIP) exclusively. For R2-key rows we leave R/S/V/W blank; for
// legacy Supabase-URL rows we passthrough the URL untouched. This keeps the
// CP导入 column count stable without per-row URL signing.
function legacyUrlOrBlank(value: string | null): string {
  const resolved = resolveRenderAsset(value);
  if (!resolved) return "";
  return resolved.kind === "legacy-url" ? resolved.url : "";
}

// 30 days. Covers the typical factory fulfillment window with margin. If a
// re-export is needed beyond that, regenerate the XLSX — fresh signed URLs.
const FACTORY_URL_TTL_SECONDS = 30 * 24 * 3600;

// Columns A–T match CP导入.xlsx row 1 exactly. The factory's import tool
// keys on these strings; do not edit A–T without matching the template.
// Columns U, V, W are Rendall-only additions (ZIP, back mockup, back print) —
// the factory import tool reads through T and ignores anything past that.
// If the factory's tooling ever chokes on row length > 21, drop V/W here and
// rely on the column-U ZIP to carry back-side files.
const HEADERS: string[] = [
  "您的订单号（选填）",      // A
  "您的清单号（选填）",      // B
  "*设计编号（SKU）",        // C
  "*数量",                   // D
  "*收件人",                 // E
  "*街道地址",               // F
  "*城市",                   // G
  "*省/州",                  // H
  "*国家（二字码）",         // I
  "*邮编",                   // J
  "*手机号码",               // K
  "物流代码（选填）",        // L
  "运单号（选填）",          // M
  "面单地址（选填）",        // N
  "颜色（选填）",            // O
  "尺码（选填）",            // P
  "清单备注（选填）",        // Q
  "效果图（选填）",          // R — front mockup URL (CP导入)
  "打印图（选填）",          // S — front print file URL (CP导入)
  "订单备注（选填）",        // T
  "文件包 / Files ZIP",      // U — Rendall-only: single-click zip of all sides' print + mockup + order.txt
  "效果图-背面 / Mockup Back", // V — Rendall-only: back mockup URL (blank if no back design)
  "打印图-背面 / Print Back",  // W — Rendall-only: back print file URL (blank if no back design)
  "外部参考 / External Ref",   // X — Rendall-only: seller's optional per-row reference (Etsy order #, Shopify SKU, etc.)
];

type ShippingAddress = {
  name?: string;
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  postal?: string;
  phone?: string;
  reference?: string;
};

type OrderItem = {
  id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  print_url_front: string | null;
  mockup_url_front: string | null;
  print_url_back: string | null;
  mockup_url_back: string | null;
  product_id_snapshot: string;
  design_snapshot: unknown;
  recipient_address: ShippingAddress | null;
};

type OrderWithItems = {
  id: string;
  shipping_address: ShippingAddress | null;
  order_items: OrderItem[];
};

function colorSlug(color: string | null): string {
  return (color ?? "").toLowerCase().trim().replace(/\s+/g, "-");
}

function compoundSku(productId: string, color: string | null, size: string | null): string {
  return `${productId}__${colorSlug(color)}__${size ?? ""}`;
}

/**
 * Build a factory-format XLSX (CP导入 layout) for the given orders.
 * One row per order_item. Rows include header row at row 1.
 */
export async function buildFactoryXlsx(orderIds: string[]): Promise<Buffer> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "id, shipping_address, order_items(id, quantity, size, color, print_url_front, mockup_url_front, print_url_back, mockup_url_back, product_id_snapshot, design_snapshot, recipient_address)",
    )
    .in("id", orderIds);

  if (error) throw error;
  const orders = (data as OrderWithItems[]) ?? [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rendallpod.com";

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Worksheet");
  ws.addRow(HEADERS);

  for (const order of orders) {
    const orderShip = order.shipping_address ?? {};
    for (const item of order.order_items) {
      // Per-item recipient (bulk orders) takes precedence; fall back to the
      // order-level shipping_address for legacy single-recipient orders.
      const ship = item.recipient_address ?? orderShip;
      const productId = item.product_id_snapshot;
      // design_snapshot.size overrides the cart-side size for v2 schemas, but
      // order_items.size is authoritative for the SKU (it was locked in at
      // checkout and is what the factory should ship).
      const cfg = item.design_snapshot as unknown;
      if (cfg && !isV2(cfg)) {
        // still proceed — we don't need mm layers for XLSX, only URLs
      }
      void (cfg as DesignConfigV2 | undefined);

      const row: (string | number | null)[] = new Array(24).fill("");
      row[2] = compoundSku(productId, item.color, item.size); // C
      row[3] = item.quantity; // D
      row[4] = ship.name ?? ""; // E
      row[5] = ship.line1 ?? ""; // F
      row[6] = ship.city ?? ""; // G
      row[7] = ship.state ?? ""; // H
      row[8] = ship.country ?? ""; // I
      row[9] = ship.postal ?? ""; // J
      row[10] = ship.phone ?? ""; // K
      row[14] = item.color ?? ""; // O
      row[15] = item.size ?? ""; // P
      row[17] = legacyUrlOrBlank(item.mockup_url_front); // R
      row[18] = legacyUrlOrBlank(item.print_url_front); // S
      row[20] = signFactoryItemUrl(item.id, FACTORY_URL_TTL_SECONDS, siteUrl).url; // U
      row[21] = legacyUrlOrBlank(item.mockup_url_back); // V
      row[22] = legacyUrlOrBlank(item.print_url_back); // W
      row[23] = (item.recipient_address as ShippingAddress | null)?.reference ?? ""; // X

      ws.addRow(row);
    }
  }

  const arr = await wb.xlsx.writeBuffer();
  return Buffer.from(arr as ArrayBuffer);
}
