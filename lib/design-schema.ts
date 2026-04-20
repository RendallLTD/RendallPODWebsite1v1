// Shared schema for design_config.sides layers. Physical-unit (mm) based,
// so a design saved on any device renders identically at print resolution.
//
// Geometry convention: xMm/yMm is the offset from the print-area center to
// the layer's center. Positive x is right; positive y is down. The
// renderer maps this onto the print canvas (or garment photo) using the
// current PrintAreaSpec.

export type MmLayer = {
  /** Base64 data URL of the uploaded image (same format as designs.image_url today). */
  image: string;
  /** Horizontal offset from print-area center to layer center, in mm. */
  xMm: number;
  /** Vertical offset from print-area center to layer center, in mm. */
  yMm: number;
  /** Rendered width on the garment, in mm. */
  widthMm: number;
  /** Rendered height on the garment, in mm. */
  heightMm: number;
};

export type DesignConfigV2 = {
  schemaVersion: 2;
  size: string;
  color: string;
  sides: Record<string, MmLayer[]>;
};

/** Convert pixels to millimeters given the print-area dimensions in each unit. */
export function pxToMm(px: number, paPx: number, paMm: number): number {
  if (paPx === 0) return 0;
  return (px / paPx) * paMm;
}

/** Convert millimeters to pixels given the print-area dimensions in each unit. */
export function mmToPx(mm: number, paPx: number, paMm: number): number {
  if (paMm === 0) return 0;
  return (mm / paMm) * paPx;
}

export function isV2(cfg: unknown): cfg is DesignConfigV2 {
  if (!cfg || typeof cfg !== "object") return false;
  const c = cfg as { schemaVersion?: unknown; sides?: unknown };
  return c.schemaVersion === 2 && typeof c.sides === "object" && c.sides !== null;
}

/**
 * Pure port of the designer's aspect-fit rendering math. Given a layer's
 * natural pixel dimensions and the print-area pixel dimensions, return the
 * base (scale=1) rendered dimensions. The renderer multiplies by scale.
 *
 * Kept server-agnostic so both the browser designer and the Node renderer
 * can agree on what "scale = 1" means.
 */
export function aspectFitSize(
  naturalW: number,
  naturalH: number,
  paW: number,
  paH: number,
): { w: number; h: number } {
  const aspect = naturalW / naturalH;
  if (aspect > paW / paH) {
    return { w: paW, h: paW / aspect };
  }
  return { w: paH * aspect, h: paH };
}
