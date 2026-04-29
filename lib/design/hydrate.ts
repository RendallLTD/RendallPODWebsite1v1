// Inverse of buildDesignPayload: given a saved DesignConfigV2 + the product's
// print specs + the current canvas print-area pixel size, reconstruct the
// pixel-coordinate DesignLayer state used by the browser designer.
//
// Each saved layer holds its position + size in mm. To put it back on the
// canvas we need:
//   1. Each image's natural pixel dimensions (loaded async via new Image()).
//   2. The print-area's current pixel dimensions (from the DOM).
// Then xMm/yMm map straight back to position via mmToPx, and scale is
// recovered as renderedPxW / aspectFitSize(natural...).w.

import type { Product, PrintAreaSpec } from "@/lib/products";
import {
  type DesignConfigV2,
  aspectFitSize,
  mmToPx,
} from "@/lib/design-schema";
import type { DesignLayer, LayerNaturalSize } from "@/components/design/DesignCanvas";

export type HydratedDesign = {
  sides: Record<string, DesignLayer[]>;
  naturalByLayer: Record<string, LayerNaturalSize>;
  size: string;
  color: string;
};

function loadImageDimensions(src: string): Promise<LayerNaturalSize> {
  // No crossOrigin: we only need naturalWidth/naturalHeight, not pixel data.
  // Setting crossOrigin would require R2 to return ACAO headers on GET, which
  // the bucket isn't configured for (CORS rule allows PUT only).
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error(`failed to load image ${src.slice(0, 64)}`));
    img.src = src;
  });
}

export async function hydrateFromDesignConfig(args: {
  config: DesignConfigV2;
  product: Product;
  printAreaPx: { w: number; h: number };
  nextLayerId: () => string;
}): Promise<HydratedDesign> {
  const { config, product, printAreaPx, nextLayerId } = args;

  const sides: Record<string, DesignLayer[]> = {};
  const naturalByLayer: Record<string, LayerNaturalSize> = {};

  for (const [side, layers] of Object.entries(config.sides ?? {})) {
    if (!layers || layers.length === 0) continue;
    const printSpec: PrintAreaSpec | undefined = product.measurements?.printSpecs?.[side];
    if (!printSpec) continue;

    const out: DesignLayer[] = [];
    for (const mm of layers) {
      const natural = await loadImageDimensions(mm.image);

      const positionX = mmToPx(mm.xMm, printAreaPx.w, printSpec.widthMm);
      const positionY = mmToPx(mm.yMm, printAreaPx.h, printSpec.heightMm);
      const renderedPxW = mmToPx(mm.widthMm, printAreaPx.w, printSpec.widthMm);

      const base = aspectFitSize(natural.w, natural.h, printAreaPx.w, printAreaPx.h);
      const scale = base.w === 0 ? 1 : renderedPxW / base.w;

      const id = nextLayerId();
      out.push({
        id,
        image: mm.image,
        position: { x: positionX, y: positionY },
        scale,
      });
      naturalByLayer[id] = natural;
    }

    if (out.length > 0) sides[side] = out;
  }

  // Initialize empty SideState for sides the product supports but that
  // weren't in the saved config. The page expects every printArea to have
  // an entry in `sides`; missing keys would crash the side-toggle UI.
  for (const side of product.printAreas) {
    if (!sides[side]) sides[side] = [];
  }

  return {
    sides,
    naturalByLayer,
    size: config.size,
    color: config.color,
  };
}
