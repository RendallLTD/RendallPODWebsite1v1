"use client";

import { useState } from "react";
import { getDesignerPhoto, getProductHero, type Product } from "@/lib/products";

export default function ProductColorPicker({ product }: { product: Product }) {
  const [selected, setSelected] = useState<string>(product.colors[0]);
  const heroFallback = getProductHero(product);
  const heroForSelected = getDesignerPhoto(product, "front", selected) ?? heroFallback;

  return (
    <>
      <div className="product-detail__img-box">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroForSelected}
          alt={`${product.name} in ${selected}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div className="product-detail__option" style={{ marginTop: 24 }}>
        <h3>Colors</h3>
        <div className="product-detail__swatches">
          {product.colors.map((c) => {
            const photo = getDesignerPhoto(product, "front", c) ?? heroFallback;
            const isSelected = c === selected;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelected(c)}
                aria-label={c}
                aria-pressed={isSelected}
                className="product-detail__swatch"
                style={{
                  outline: isSelected ? "2px solid #1a1a1a" : "1px solid #ddd",
                  outlineOffset: isSelected ? 2 : 0,
                }}
                title={c}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" />
                <span className="product-detail__swatch-label">{c}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
