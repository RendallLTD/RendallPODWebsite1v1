import ExcelJS from "exceljs";
import { createAdminClient } from "@/lib/supabase/admin";
import { isV2, type DesignConfigV2 } from "@/lib/design-schema";

// Column headers match CP导入.xlsx row 1 exactly. The factory's import tool
// keys on these strings; do not edit without matching the template.
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
  "效果图（选填）",          // R — mockup URL
  "打印图（选填）",          // S — print file URL
  "订单备注（选填）",        // T
];

type ShippingAddress = {
  name?: string;
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  postal?: string;
  phone?: string;
};

type OrderItem = {
  id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  print_url_front: string | null;
  mockup_url_front: string | null;
  designs:
    | { product_id: string; design_config: unknown }
    | { product_id: string; design_config: unknown }[]
    | null;
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
    .select("id, shipping_address, order_items(id, quantity, size, color, print_url_front, mockup_url_front, designs:design_id(product_id, design_config))")
    .in("id", orderIds);

  if (error) throw error;
  const orders = (data as OrderWithItems[]) ?? [];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Worksheet");
  ws.addRow(HEADERS);

  for (const order of orders) {
    const ship = order.shipping_address ?? {};
    for (const item of order.order_items) {
      const design = Array.isArray(item.designs) ? item.designs[0] : item.designs;
      const productId = design?.product_id ?? "";
      // design_config.size overrides the cart-side size for v2 schemas, but
      // order_items.size is authoritative for the SKU (it was locked in at
      // checkout and is what the factory should ship).
      const cfg = design?.design_config as unknown;
      if (cfg && !isV2(cfg)) {
        // still proceed — we don't need mm layers for XLSX, only URLs
      }
      void (cfg as DesignConfigV2 | undefined);

      const row: (string | number | null)[] = new Array(20).fill("");
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
      row[17] = item.mockup_url_front ?? ""; // R
      row[18] = item.print_url_front ?? ""; // S

      ws.addRow(row);
    }
  }

  const arr = await wb.xlsx.writeBuffer();
  return Buffer.from(arr as ArrayBuffer);
}
