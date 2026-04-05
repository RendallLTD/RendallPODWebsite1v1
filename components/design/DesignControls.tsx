"use client";

import type { Product } from "@/lib/products";

type Props = {
  product: Product;
  scale: number;
  onScaleChange: (scale: number) => void;
  onReset: () => void;
  onSave: () => void;
  onAddToCart: () => void;
  hasDesign: boolean;
  saving: boolean;
  selectedSize: string;
  onSizeChange: (size: string) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
};

export default function DesignControls({
  product, scale, onScaleChange, onReset, onSave, onAddToCart,
  hasDesign, saving, selectedSize, onSizeChange, selectedColor, onColorChange,
}: Props) {
  return (
    <div className="design-controls">
      <h3>Product Options</h3>

      <div className="design-controls__field">
        <label>Size</label>
        <select value={selectedSize} onChange={(e) => onSizeChange(e.target.value)}>
          {product.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="design-controls__field">
        <label>Color</label>
        <select value={selectedColor} onChange={(e) => onColorChange(e.target.value)}>
          {product.colors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="design-controls__field">
        <label>Design Scale: {Math.round(scale * 100)}%</label>
        <input
          type="range"
          min="0.2"
          max="2"
          step="0.05"
          value={scale}
          onChange={(e) => onScaleChange(parseFloat(e.target.value))}
        />
      </div>

      <button className="btn btn--outline" onClick={onReset} style={{ width: "100%", marginBottom: 12 }}>
        Reset position
      </button>

      <button
        className="btn btn--dark"
        onClick={onSave}
        disabled={!hasDesign || saving}
        style={{ width: "100%", marginBottom: 12 }}
      >
        {saving ? "Saving..." : "Save design"}
      </button>

      <button
        className="btn btn--primary"
        onClick={onAddToCart}
        disabled={!hasDesign}
        style={{ width: "100%" }}
      >
        Add to cart
      </button>
    </div>
  );
}
