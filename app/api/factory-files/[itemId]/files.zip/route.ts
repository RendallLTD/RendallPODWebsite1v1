import archiver from "archiver";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFactoryItemSignature } from "@/lib/factory-files/sign";
import { fetchAssetBuffer } from "@/lib/render/asset-url";

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
  print_url_back: string | null;
  mockup_url_back: string | null;
  product_id_snapshot: string;
  orders: {
    id: string;
    shipping_address: ShippingAddress | null;
  } | null;
};

function bilingualOrderTxt(item: ItemRow, sidesIncluded: string[]): string {
  const ship = item.orders?.shipping_address ?? {};
  const productId = item.product_id_snapshot;
  const lines = [
    `订单号 / Order ID: ${item.orders?.id ?? ""}`,
    `订单项 / Item ID: ${item.id}`,
    `设计编号 / Design SKU: ${productId}`,
    `数量 / Quantity: ${item.quantity}`,
    `颜色 / Color: ${item.color ?? ""}`,
    `尺码 / Size: ${item.size ?? ""}`,
    `包含面 / Sides included: ${sidesIncluded.join(", ")}`,
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
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  const url = new URL(request.url);
  const verification = verifyFactoryItemSignature({
    itemId,
    exp: url.searchParams.get("exp"),
    sig: url.searchParams.get("sig"),
  });
  if (!verification.ok) {
    const status = verification.reason === "expired" ? 410 : 401;
    return new Response(verification.reason, { status });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("order_items")
    .select(
      "id, quantity, size, color, print_url_front, mockup_url_front, print_url_back, mockup_url_back, product_id_snapshot, orders:order_id(id, shipping_address)",
    )
    .eq("id", itemId)
    .single();

  if (error || !data) {
    return new Response("not found", { status: 404 });
  }
  const item = data as unknown as ItemRow;

  const sides = [
    { key: "front", printAsset: item.print_url_front, mockupAsset: item.mockup_url_front },
    { key: "back", printAsset: item.print_url_back, mockupAsset: item.mockup_url_back },
  ].filter(
    (s): s is { key: string; printAsset: string; mockupAsset: string } =>
      !!s.printAsset && !!s.mockupAsset,
  );

  if (sides.length === 0) {
    return new Response("render not ready", { status: 409 });
  }

  // Fetch every side's print + mockup in parallel. fetchAssetBuffer detects
  // R2 keys (post-2026-05-28) vs legacy Supabase URLs and dispatches.
  const fetched = await Promise.all(
    sides.flatMap((s) => [
      fetchAssetBuffer(s.printAsset).then((buf) => ({ side: s.key, kind: "print" as const, buf })),
      fetchAssetBuffer(s.mockupAsset).then((buf) => ({ side: s.key, kind: "mockup" as const, buf })),
    ]),
  );
  if (fetched.some((f) => !f.buf)) {
    return new Response("asset fetch failed", { status: 502 });
  }

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

      for (const f of fetched) {
        zip.append(f.buf as Buffer, {
          name: `${filenameBase}_${f.kind}_${f.side}.png`,
        });
      }
      zip.append(
        bilingualOrderTxt(item, sides.map((s) => s.key)),
        { name: `${filenameBase}_order.txt` },
      );
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
