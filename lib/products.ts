export type PrintAreaOverlay = {
  /** Position of print area box on the product photo, as percentages (0–1) */
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PrintAreaSpec = {
  /** Max print width in mm */
  widthMm: number;
  /** Max print height in mm */
  heightMm: number;
  /** Offset from top of garment in mm */
  topOffsetMm: number;
  /** Where to draw the print area box on the product photo */
  overlay: PrintAreaOverlay;
};

export type GarmentMeasurements = {
  /** Body width (pit-to-pit) per size in inches */
  widthBySize: Record<string, number>;
  /** Body length (shoulder-to-hem) per size in inches */
  lengthBySize: Record<string, number>;
  /** Print area specs per side */
  printSpecs: Record<string, PrintAreaSpec>;
};

export type Product = {
  id: string;
  brand: string;
  name: string;
  price: string;
  priceCents: number;
  premium: string;
  meta: string[];
  emoji: string;
  category: "clothing" | "accessories";
  subcategory: string;
  description: string;
  sizes: string[];
  colors: string[];
  printAreas: string[];
  /** Hero image shown on catalog cards & product page (overrides the /products/{id}.png convention) */
  heroImage?: string;
  /** Per-color image paths keyed by color name (lowercase, spaces stripped) */
  colorImages?: Record<string, { front: string; back?: string }>;
  /** Product photos per side (paths in /public) */
  photos?: Record<string, string>;
  /** Real garment measurements for the designer */
  measurements?: GarmentMeasurements;
};

export const allProducts: Product[] = [
  // ── T-Shirts ──────────────────────────────────────────────────────────
  {
    id: "mens-crewneck-tee",
    brand: "Rendall",
    name: "Men's 180gsm Crewneck T-Shirt",
    price: "$5.00",
    priceCents: 500,
    premium: "$4.00",
    meta: ["8 sizes", "7 colors"],
    emoji: "👕",
    category: "clothing",
    subcategory: "T-Shirts",
    description: "Classic 180gsm cotton crewneck tee. Comfortable everyday wear, perfect for bold graphic designs. DTF printed for vibrant, durable results.",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    colors: ["White", "Black", "Grey", "Navy", "Red", "Beige", "Dark Pink"],
    printAreas: ["front", "back"],
    heroImage: "/products/mens-crewneck-tee/white/mens-crewneck-tee-white.png",
    colorImages: {
      white:    { front: "/products/mens-crewneck-tee/white/mens-crewneck-tee-white.png" },
      black:    { front: "/products/mens-crewneck-tee/black/mens-crewneck-tee-black.png" },
      grey:     { front: "/products/mens-crewneck-tee/grey/mens-crewneck-tee-grey.png", back: "/products/mens-crewneck-tee/grey/mens-crewneck-tee-grey-back.png" },
      navy:     { front: "/products/mens-crewneck-tee/navy/mens-crewneck-tee-navy.jpg" },
      red:      { front: "/products/mens-crewneck-tee/red/mens-crewneck-tee-red.png", back: "/products/mens-crewneck-tee/red/mens-crewneck-tee-red-back.png" },
      beige:    { front: "/products/mens-crewneck-tee/beige/mens-crewneck-tee-beige.png" },
      darkpink: { front: "/products/mens-crewneck-tee/darkpink/mens-crewneck-tee-darkpink.png" },
    },
    measurements: {
      widthBySize: { S: 20.5, M: 22, L: 23.5, XL: 25, "2XL": 26.75, "3XL": 28.25, "4XL": 29.75, "5XL": 31.25 },
      lengthBySize: { S: 26.25, M: 27.25, L: 28.25, XL: 29.25, "2XL": 30.25, "3XL": 31.25, "4XL": 32.25, "5XL": 33.25 },
      printSpecs: {
        front: { widthMm: 300, heightMm: 400, topOffsetMm: 80, overlay: { left: 0.35, top: 0.27, width: 0.28, height: 0.38 } },
        back: { widthMm: 300, heightMm: 400, topOffsetMm: 60, overlay: { left: 0.34, top: 0.20, width: 0.30, height: 0.40 } },
      },
    },
  },
  { id: "vintage-wash-drop-shoulder-tee", brand: "Rendall", name: "Heavyweight Vintage Wash Drop-Shoulder Tee", price: "$8.10", priceCents: 810, premium: "$6.48", meta: ["6 sizes", "8 colors"], emoji: "👕", category: "clothing", subcategory: "T-Shirts", description: "230gsm heavyweight cotton tee with a vintage wash finish and relaxed drop-shoulder silhouette. Premium streetwear feel.", sizes: ["S", "M", "L", "XL", "2XL", "3XL"], colors: ["Black", "Grey", "Purple", "Blue", "Military Green", "Brown", "Khaki", "Rose Red"], printAreas: ["front", "back"] },
  { id: "mens-long-sleeve-tee", brand: "Rendall", name: "Men's Long Sleeve Crewneck T-Shirt", price: "$7.00", priceCents: 700, premium: "$5.60", meta: ["6 sizes", "4 colors"], emoji: "👕", category: "clothing", subcategory: "T-Shirts", description: "180gsm cotton long sleeve crewneck. Great for layering or standalone wear in cooler weather. DTF printed.", sizes: ["S", "M", "L", "XL", "2XL", "3XL"], colors: ["Black", "White", "Navy", "Khaki"], printAreas: ["front", "back"] },

  // ── Kids ───────────────────────────────────────────────────────────────
  { id: "kids-cotton-tee", brand: "Rendall", name: "Kids' 180gsm Cotton T-Shirt", price: "$6.20", priceCents: 620, premium: "$4.96", meta: ["5 sizes", "3 colors"], emoji: "🧒", category: "clothing", subcategory: "Kids", description: "Soft 180gsm cotton tee sized for kids ages 4–12. Same quality print as our adult range. DTF heat transfer for designs that last.", sizes: ["4Y", "6Y", "8Y", "10Y", "12Y"], colors: ["Black", "White", "Pink"], printAreas: ["front", "back"] },
  { id: "kids-premium-sweatshirt", brand: "Rendall", name: "Kids' Premium Crewneck Sweatshirt", price: "$9.60", priceCents: 960, premium: "$7.68", meta: ["6 sizes", "3 colors"], emoji: "🧒", category: "clothing", subcategory: "Kids", description: "330gsm premium cotton blend crewneck sweatshirt for kids. Heavyweight and durable for everyday wear.", sizes: ["XS", "S", "M", "L", "XL", "XXL"], colors: ["Black", "Red", "Khaki"], printAreas: ["front", "back"] },

  // ── Hoodies & Sweatshirts ─────────────────────────────────────────────
  { id: "classic-pullover-hoodie", brand: "Rendall", name: "Classic Pullover Fleece Hoodie", price: "$12.40", priceCents: 1240, premium: "$9.92", meta: ["6 sizes", "6 colors"], emoji: "🧥", category: "clothing", subcategory: "Hoodies & Sweatshirts", description: "Cozy 50/50 cotton-polyester fleece hoodie with kangaroo pocket and drawstring hood. A staple for any apparel line.", sizes: ["S", "M", "L", "XL", "2XL", "3XL"], colors: ["Black", "White", "Red", "Dark Grey", "Light Grey", "Navy"], printAreas: ["front", "back"] },
  { id: "mens-crewneck-sweatshirt", brand: "Rendall", name: "Men's Crewneck Sweatshirt", price: "$9.00", priceCents: 900, premium: "$7.20", meta: ["6 sizes", "6 colors"], emoji: "👔", category: "clothing", subcategory: "Hoodies & Sweatshirts", description: "96% polyester / 4% cotton crewneck sweatshirt. Smooth exterior for crisp DTF prints. Comfortable relaxed fit.", sizes: ["S", "M", "L", "XL", "2XL", "3XL"], colors: ["Black", "White", "Red", "Dark Grey", "Light Grey", "Navy"], printAreas: ["front", "back"] },

  // ── Tank Tops ─────────────────────────────────────────────────────────
  { id: "athletic-muscle-tank", brand: "Rendall", name: "Athletic Muscle Tank", price: "$6.40", priceCents: 640, premium: "$5.12", meta: ["6 sizes", "2 colors"], emoji: "💪", category: "clothing", subcategory: "Tank Tops", description: "180gsm cotton muscle tank with cut-off sleeves. Perfect for gym wear, festival merch, or summer collections.", sizes: ["S", "M", "L", "XL", "2XL", "3XL"], colors: ["Black", "White"], printAreas: ["front", "back"] },
  { id: "classic-sleeveless-tee", brand: "Rendall", name: "Classic Sleeveless T-Shirt", price: "$7.00", priceCents: 700, premium: "$5.60", meta: ["6 sizes", "2 colors"], emoji: "🩱", category: "clothing", subcategory: "Tank Tops", description: "180gsm cotton sleeveless tee with a relaxed fit. Clean lines for a versatile casual look.", sizes: ["S", "M", "L", "XL", "2XL", "3XL"], colors: ["Black", "White"], printAreas: ["front", "back"] },
  { id: "vintage-wash-sleeveless-tee", brand: "Rendall", name: "Vintage Wash Sleeveless Tee", price: "$8.00", priceCents: 800, premium: "$6.40", meta: ["6 sizes", "1 color"], emoji: "🏋️", category: "clothing", subcategory: "Tank Tops", description: "100% cotton sleeveless tee with a vintage wash finish. Distressed streetwear aesthetic.", sizes: ["S", "M", "L", "XL", "2XL", "3XL"], colors: ["Black"], printAreas: ["front", "back"] },

  // ── Polos ──────────────────────────────────────────────────────────────
  { id: "mens-polo-shirt", brand: "Rendall", name: "Men's Short Sleeve Polo Shirt", price: "$8.10", priceCents: 810, premium: "$6.48", meta: ["5 sizes", "2 colors"], emoji: "👔", category: "clothing", subcategory: "Polos", description: "65% cotton / 35% polyester polo at 180gsm. Ribbed collar and cuffs. Smart-casual option for branded apparel.", sizes: ["M", "L", "XL", "2XL", "3XL"], colors: ["Black", "White"], printAreas: ["front", "back"] },

  // ── Sets & Shorts ─────────────────────────────────────────────────────
  { id: "mens-casual-shorts", brand: "Rendall", name: "Men's Casual Lounge Shorts", price: "$7.20", priceCents: 720, premium: "$5.76", meta: ["6 sizes", "3 colors"], emoji: "🩳", category: "clothing", subcategory: "Sets & Shorts", description: "220gsm polyester casual shorts. Lightweight, comfortable, and perfect for loungewear or athleisure lines.", sizes: ["S", "M", "L", "XL", "2XL", "3XL"], colors: ["Black", "Khaki", "Light Grey"], printAreas: ["front"] },
  { id: "mens-tshirt-shorts-set", brand: "Rendall", name: "Men's T-Shirt & Shorts Set", price: "$12.40", priceCents: 1240, premium: "$9.92", meta: ["6 sizes", "1 color"], emoji: "🏃", category: "clothing", subcategory: "Sets & Shorts", description: "Matching tee and shorts set. Top: 180gsm cotton. Bottom: 220gsm polyester. Includes one print on top and one on bottom.", sizes: ["S", "M", "L", "XL", "2XL", "3XL"], colors: ["Black"], printAreas: ["front"] },

  // ── Outerwear ─────────────────────────────────────────────────────────
  { id: "mens-fleece-lined-jacket", brand: "Rendall", name: "Men's Fleece-Lined Jacket", price: "$19.60", priceCents: 1960, premium: "$15.68", meta: ["5 sizes", "3 colors"], emoji: "🧥", category: "clothing", subcategory: "Outerwear", description: "80% polyester / 20% soft fleece lined jacket. Front print only. Warm, stylish, and great for premium branded collections.", sizes: ["M", "L", "XL", "2XL", "3XL"], colors: ["Black", "Grey", "Red"], printAreas: ["front"] },
  { id: "mens-colorblock-jacket", brand: "Rendall", name: "Men's Colorblock Fleece-Lined Jacket", price: "$19.60", priceCents: 1960, premium: "$15.68", meta: ["1 size", "2 colors"], emoji: "🧥", category: "clothing", subcategory: "Outerwear", description: "95% polyester / 5% spandex colorblock jacket with fleece lining. Front print only. Bold two-tone design.", sizes: ["M"], colors: ["Grey", "Red"], printAreas: ["front"] },

  // ── Hats ──────────────────────────────────────────────────────────────
  { id: "vintage-wash-baseball-cap", brand: "Rendall", name: "Vintage Wash Denim Baseball Cap", price: "$5.80", priceCents: 580, premium: "$4.64", meta: ["OSFM", "7 colors"], emoji: "🧢", category: "accessories", subcategory: "Hats", description: "100% washed cotton denim baseball cap. Adjustable strap. Single-sided DTF print on front panel.", sizes: ["OSFM"], colors: ["Black", "Grey", "Charcoal", "Red", "Navy", "Mid-Blue", "Sand"], printAreas: ["front"] },
  { id: "vintage-wash-trucker-hat", brand: "Rendall", name: "Vintage Wash Denim Trucker Hat", price: "$5.80", priceCents: 580, premium: "$4.64", meta: ["OSFM", "4 colors"], emoji: "🧢", category: "accessories", subcategory: "Hats", description: "Cotton front panel with breathable mesh back. Vintage wash finish with adjustable snapback. Single-sided print.", sizes: ["OSFM"], colors: ["Black", "Grey", "Navy", "Sand"], printAreas: ["front"] },
  { id: "classic-6-panel-cap", brand: "Rendall", name: "Classic 6-Panel Sandwich Bill Cap", price: "$5.80", priceCents: 580, premium: "$4.64", meta: ["OSFM", "7 colors"], emoji: "🧢", category: "accessories", subcategory: "Hats", description: "100% polyester 6-panel cap with contrasting sandwich bill detail. Structured front for clean DTF prints.", sizes: ["OSFM"], colors: ["Black", "White", "Grey", "Red", "Mid-Blue", "Navy", "Khaki"], printAreas: ["front"] },
  { id: "classic-5-panel-cap", brand: "Rendall", name: "Classic 5-Panel Sandwich Bill Cap", price: "$5.80", priceCents: 580, premium: "$4.64", meta: ["OSFM", "4 colors"], emoji: "🧢", category: "accessories", subcategory: "Hats", description: "100% polyester 5-panel cap with low-profile fit and sandwich bill. Clean, modern silhouette.", sizes: ["OSFM"], colors: ["Black", "White", "Red", "Blue"], printAreas: ["front"] },

  // ── Bags ───────────────────────────────────────────────────────────────
  { id: "heavyweight-canvas-tote", brand: "Rendall", name: "Heavyweight Canvas Tote Bag", price: "$5.00", priceCents: 500, premium: "$4.00", meta: ["OSFM", "1 color"], emoji: "👜", category: "accessories", subcategory: "Bags", description: "12oz canvas tote bag (65% polyester / 35% cotton). Durable and spacious. Single-sided DTF print.", sizes: ["OSFM"], colors: ["White / Natural"], printAreas: ["front"] },

  // ── Test ───────────────────────────────────────────────────────────────
  {
    id: "product-designer-test",
    brand: "Rendall",
    name: "Product Designer Test",
    price: "$5.00",
    priceCents: 500,
    premium: "$4.00",
    meta: ["6 sizes", "3 colors"],
    emoji: "👕",
    category: "clothing",
    subcategory: "T-Shirts",
    description: "Test product for designer development.",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    colors: ["Black", "White", "Grey"],
    printAreas: ["front", "back"],
    photos: {
      front: "/Product Designer Test Assets/Front.png",
      back: "/Product Designer Test Assets/Back.png",
    },
    measurements: {
      widthBySize: { S: 20.5, M: 22, L: 23.5, XL: 25, "2XL": 26.75, "3XL": 28.25 },
      lengthBySize: { S: 26.25, M: 27.25, L: 28.25, XL: 29.25, "2XL": 30.25, "3XL": 31.25 },
      printSpecs: {
        front: { widthMm: 300, heightMm: 400, topOffsetMm: 80, overlay: { left: 0.31, top: 0.27, width: 0.38, height: 0.38 } },
        back: { widthMm: 300, heightMm: 400, topOffsetMm: 60, overlay: { left: 0.30, top: 0.20, width: 0.40, height: 0.40 } },
      },
    },
  },
];

// Ordered subcategories for catalog display
export const subcategories = [
  "T-Shirts",
  "Kids",
  "Hoodies & Sweatshirts",
  "Tank Tops",
  "Polos",
  "Sets & Shorts",
  "Outerwear",
  "Hats",
  "Bags",
] as const;

export function getProductHero(product: Product): string {
  return product.heroImage ?? `/products/${product.id}.png`;
}

function colorKey(color: string): string {
  return color.toLowerCase().replace(/\s+/g, "");
}

/** Resolve the garment photo shown in the designer for a given side + color.
 *  Prefers colorImages[color][side], falls back to the color's front, then to photos[side]. */
export function getDesignerPhoto(product: Product, side: string, color: string): string | undefined {
  const key = colorKey(color);
  const byColor = product.colorImages?.[key];
  if (byColor) {
    if (side === "back" && byColor.back) return byColor.back;
    return byColor.front;
  }
  return product.photos?.[side];
}

/** Whether a real photo exists for this side+color (used to disable side toggle when a back is missing). */
export function hasSidePhoto(product: Product, side: string, color: string): boolean {
  const key = colorKey(color);
  const byColor = product.colorImages?.[key];
  if (byColor) {
    if (side === "front") return true;
    if (side === "back") return !!byColor.back;
  }
  return !!product.photos?.[side];
}

export function getProductById(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id);
}

export function getProductsBySubcategory(sub: string): Product[] {
  return allProducts.filter((p) => p.subcategory === sub);
}
