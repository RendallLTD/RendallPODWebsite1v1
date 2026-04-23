import archiver from "archiver";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ShippingAddress = {
  name?: string;
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  postal?: string;
  phone?: string;
};

type ItemRow = {
  id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  print_url_front: string | null;
  mockup_url_front: string | null;
  designs: { product_id: string } | { product_id: string }[] | null;
  orders: {
    id: string;
    shipping_address: ShippingAddress | null;
  } | null;
};

function bilingualOrderTxt(item: ItemRow): string {
  const ship = item.orders?.shipping_address ?? {};
  const design = Array.isArray(item.designs) ? item.designs[0] : item.designs;
  const productId = design?.product_id ?? "";
  const lines = [
    `订单号 / Order ID: ${item.orders?.id ?? ""}`,
    `订单项 / Item ID: ${item.id}`,
    `设计编号 / Design SKU: ${productId}`,
    `数量 / Quantity: ${item.quantity}`,
    `颜色 / Color: ${item.color ?? ""}`,
    `尺码 / Size: ${item.size ?? ""}`,
    "",
    `收件人 / Recipient: ${ship.name ?? ""}`,
    `街道地址 / Street: ${ship.line1 ?? ""}`,
    `城市 / City: ${ship.city ?? ""}`,
    `省/州 / State: ${ship.state ?? ""}`,
    `国家 / Country: ${ship.country ?? ""}`,
    `邮编 / Postal Code: ${ship.postal ?? ""}`,
    `手机号码 / Phone: ${ship.phone ?? ""}`,
  ];
  return lines.join("\n") + "\n";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("order_items")
    .select(
      "id, quantity, size, color, print_url_front, mockup_url_front, designs:design_id(product_id), orders:order_id(id, shipping_address)",
    )
    .eq("id", itemId)
    .single();

  if (error || !data) {
    return new Response("not found", { status: 404 });
  }
  const item = data as ItemRow;

  if (!item.print_url_front || !item.mockup_url_front) {
    return new Response("render not ready", { status: 409 });
  }

  const [printRes, mockupRes] = await Promise.all([
    fetch(item.print_url_front),
    fetch(item.mockup_url_front),
  ]);
  if (!printRes.ok || !mockupRes.ok) {
    return new Response("asset fetch failed", { status: 502 });
  }
  const [printBuf, mockupBuf] = await Promise.all([
    printRes.arrayBuffer(),
    mockupRes.arrayBuffer(),
  ]);

  const orderShort = (item.orders?.id ?? "order").slice(0, 8);
  const filenameBase = `rendall_${orderShort}_${item.color ?? ""}_${item.size ?? ""}`
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_");

  const zip = archiver("zip", { zlib: { level: 6 } });
  const stream = new ReadableStream({
    start(controller) {
      zip.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      zip.on("end", () => controller.close());
      zip.on("error", (err) => controller.error(err));

      zip.append(Buffer.from(printBuf), { name: `${filenameBase}_print.png` });
      zip.append(Buffer.from(mockupBuf), { name: `${filenameBase}_mockup.png` });
      zip.append(bilingualOrderTxt(item), { name: `${filenameBase}_order.txt` });
      zip.finalize();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filenameBase}.zip"`,
      "cache-control": "no-store",
    },
  });
}
