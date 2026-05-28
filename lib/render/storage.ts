import { serverPutObject } from "@/lib/r2/client";
import { factoryRenderKey, getFactoryBucket, type RenderKind, type RenderSide } from "@/lib/r2/factory-keys";

/**
 * Upload a rendered PNG buffer to the private R2 factory bucket and return the
 * stable R2 object key (not a URL). The key is stored in
 * `order_items.{print,mockup}_url_{front,side}` (column name retained for
 * back-compat — see lib/render/asset-url.ts for the resolver that interprets
 * key-vs-legacy-URL on read).
 *
 * Overwrites on collision so a re-render replaces the previous output at the
 * same key.
 */
export async function uploadFactoryPng(args: {
  orderId: string;
  itemId: string;
  kind: RenderKind;
  side: RenderSide;
  buffer: Buffer;
}): Promise<string> {
  const key = factoryRenderKey({
    orderId: args.orderId,
    itemId: args.itemId,
    kind: args.kind,
    side: args.side,
  });
  await serverPutObject(getFactoryBucket(), key, args.buffer, "image/png");
  return key;
}
