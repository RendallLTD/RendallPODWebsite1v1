import sharp from "sharp";
import type { PrintAreaSpec } from "@/lib/products";
import type { MmLayer } from "@/lib/design-schema";

export type RenderPrintParams = {
  printSpec: PrintAreaSpec;
  layers: MmLayer[];
  /** DPI for the output. 300 is DTF industry standard. */
  dpi?: number;
};

const MM_PER_INCH = 25.4;

function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm * dpi) / MM_PER_INCH);
}

/**
 * Decode a data URL or raw base64 string into a Buffer.
 * MmLayer.image is typically "data:image/png;base64,..." from the uploader.
 */
function decodeImage(source: string): Buffer {
  const comma = source.indexOf(",");
  const b64 = comma >= 0 ? source.slice(comma + 1) : source;
  return Buffer.from(b64, "base64");
}

/**
 * Render a transparent-background PNG at the physical print-area dimensions.
 * Each MmLayer is resized to its widthMm × heightMm at the target DPI and
 * composited at (xMm, yMm) offset from the canvas center.
 */
export async function renderPrintPng(params: RenderPrintParams): Promise<Buffer> {
  const dpi = params.dpi ?? 300;
  const canvasW = mmToPx(params.printSpec.widthMm, dpi);
  const canvasH = mmToPx(params.printSpec.heightMm, dpi);

  const composites: sharp.OverlayOptions[] = [];

  for (const layer of params.layers) {
    const layerW = mmToPx(layer.widthMm, dpi);
    const layerH = mmToPx(layer.heightMm, dpi);
    if (layerW <= 0 || layerH <= 0) continue;

    const resized = await sharp(decodeImage(layer.image))
      .resize(layerW, layerH, { fit: "fill" })
      .png()
      .toBuffer();

    // xMm/yMm = center-to-center offset → top-left position for composite
    const left = Math.round(canvasW / 2 + mmToPx(layer.xMm, dpi) - layerW / 2);
    const top = Math.round(canvasH / 2 + mmToPx(layer.yMm, dpi) - layerH / 2);

    composites.push({ input: resized, left, top });
  }

  const canvas = sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  const out = composites.length > 0 ? canvas.composite(composites) : canvas;
  return out.png().toBuffer();
}
