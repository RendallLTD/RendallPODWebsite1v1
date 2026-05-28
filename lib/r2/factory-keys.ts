export type RenderKind = "print" | "mockup";
export type RenderSide = "front" | "back";

// Stable per-(order, item, kind, side) so re-renders overwrite at the same key.
// Mirrors the old Supabase `factory-exports` path convention.
export function factoryRenderKey(args: {
  orderId: string;
  itemId: string;
  kind: RenderKind;
  side: RenderSide;
}): string {
  return `factory/${args.orderId}/${args.itemId}/${args.kind}-${args.side}.png`;
}

export function getFactoryBucket(): string {
  const b = process.env.R2_FACTORY_BUCKET;
  if (!b) throw new Error("R2_FACTORY_BUCKET env var missing");
  return b;
}
