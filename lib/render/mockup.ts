import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { PrintAreaSpec } from "@/lib/products";
import type { MmLayer } from "@/lib/design-schema";

export type RenderMockupParams = {
  /** Path from getDesignerPhoto (e.g. "/products/...png"); resolved under /public. */
  productPhotoPath: string;
  printSpec: PrintAreaSpec;
  layers: MmLayer[];
};

/**
 * Render a PNG of the garment photo with the design composited over the
 * print-area rectangle. Preserves the garment photo's native resolution.
 *
 * Coordinate math mirrors the browser designer: the print-area rectangle is
 * placed on the photo at `printSpec.overlay` (fractions of photo width/
 * height); within that rectangle a layer at (xMm, yMm) is offset from the
 * rectangle's center by xMm/yMm scaled by the rect's px-per-mm.
 */
export async function renderMockupPng(params: RenderMockupParams): Promise<Buffer> {
  const fsPath = path.join(
    process.cwd(),
    "public",
    params.productPhotoPath.replace(/^\//, "")
  );
  const photoBuf = await fs.readFile(fsPath);
  const meta = await sharp(photoBuf).metadata();
  const photoW = meta.width ?? 0;
  const photoH = meta.height ?? 0;
  if (photoW === 0 || photoH === 0) {
    throw new Error(`Could not read dimensions of ${fsPath}`);
  }

  const overlay = params.printSpec.overlay;
  const paLeft = overlay.left * photoW;
  const paTop = overlay.top * photoH;
  const paW = overlay.width * photoW;
  const paH = overlay.height * photoH;

  const pxPerMmW = paW / params.printSpec.widthMm;
  const pxPerMmH = paH / params.printSpec.heightMm;

  const composites: sharp.OverlayOptions[] = [];

  for (const layer of params.layers) {
    const layerPxW = Math.round(layer.widthMm * pxPerMmW);
    const layerPxH = Math.round(layer.heightMm * pxPerMmH);
    if (layerPxW <= 0 || layerPxH <= 0) continue;

    const resized = await sharp(decodeImage(layer.image))
      .resize(layerPxW, layerPxH, { fit: "fill" })
      .png()
      .toBuffer();

    const centerX = paLeft + paW / 2 + layer.xMm * pxPerMmW;
    const centerY = paTop + paH / 2 + layer.yMm * pxPerMmH;
    const left = Math.round(centerX - layerPxW / 2);
    const top = Math.round(centerY - layerPxH / 2);

    composites.push({ input: resized, left, top });
  }

  const base = sharp(photoBuf);
  const out = composites.length > 0 ? base.composite(composites) : base;
  return out.png().toBuffer();
}

function decodeImage(source: string): Buffer {
  const comma = source.indexOf(",");
  const b64 = comma >= 0 ? source.slice(comma + 1) : source;
  return Buffer.from(b64, "base64");
}
