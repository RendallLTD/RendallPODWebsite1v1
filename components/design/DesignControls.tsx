"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import type { DesignLayer } from "./DesignCanvas";

type Props = {
  product: Product;
  activeSide: string;
  onSideChange: (side: string) => void;
  // Layer management
  layers: DesignLayer[];
  activeLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onAddLayer: () => void;
  // Active layer controls
  scale: number;
  onScaleChange: (scale: number) => void;
  onAlign: (alignment: string) => void;
  onReset: () => void;
  designDimensions: { widthCm: number; heightCm: number } | null;
  // Product options
  selectedSize: string;
  onSizeChange: (size: string) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  // Actions
  onSave: () => void;
  onAddToCart: () => void;
  hasDesign: boolean;
  saving: boolean;
  isEditing?: boolean;
  bulkMode?: boolean;
};

export default function DesignControls({
  product,
  activeSide,
  onSideChange,
  layers,
  activeLayerId,
  onSelectLayer,
  onDeleteLayer,
  onAddLayer,
  scale,
  onScaleChange,
  onAlign,
  onReset,
  designDimensions,
  selectedSize,
  onSizeChange,
  selectedColor,
  onColorChange,
  onSave,
  onAddToCart,
  hasDesign,
  saving,
  isEditing = false,
  bulkMode = false,
}: Props) {
  const hasActiveLayer = activeLayerId !== null;
  const [showPerGarment, setShowPerGarment] = useState(false);

  return (
    <div className="design-controls design-controls--term">
      {/* Front / Back toggle */}
      {product.printAreas.length > 1 && (
        <div className="design-controls__card" data-term-label="Side">
          <div className="design-controls__sides" style={{ marginBottom: 0 }}>
            {product.printAreas.map((side) => {
              // All sides are clickable in the two-canvas designer; the inactive
              // canvas falls back to a placeholder if there's no photo for that side.
              const available = true;
              return (
                <button
                  key={side}
                  className={`design-controls__side-btn ${activeSide === side ? "design-controls__side-btn--active" : ""}`}
                  onClick={() => available && onSideChange(side)}
                  disabled={!available}
                  title={available ? undefined : `${side.charAt(0).toUpperCase() + side.slice(1)} photo unavailable for ${selectedColor}`}
                  style={!available ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                >
                  {side.charAt(0).toUpperCase() + side.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Garment options (color + size) */}
      <div className="design-controls__card" data-term-label="Garment">
      <div className="design-controls__field">
        <label>Color</label>
        <select value={selectedColor} onChange={(e) => onColorChange(e.target.value)}>
          {product.colors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "#d96b6b", fontWeight: 400 }}>
        Color &amp; size set per recipient at checkout
      </div>
      </div>

      {/* Your design (layers) */}
      <div className="design-controls__card" data-term-label="Design">
      <div className="design-controls__section-label">Your design ({activeSide})</div>
      <div className="design-controls__layers" style={{ marginBottom: 0 }}>
        {layers.map((layer, i) => (
          <div
            key={layer.id}
            className={`design-controls__layer ${layer.id === activeLayerId ? "design-controls__layer--active" : ""}`}
            onClick={() => onSelectLayer(layer.id)}
          >
            <img src={layer.image} alt="" className="design-controls__layer-thumb" />
            <span className="design-controls__layer-name">Design {i + 1}</span>
            <button
              className="design-controls__layer-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLayer(layer.id);
              }}
              title="Remove layer"
            >
              ×
            </button>
          </div>
        ))}
        <button className="design-controls__add-layer" onClick={onAddLayer}>
          + Add design
        </button>
      </div>
      </div>

      {hasActiveLayer && (
        <>
          <div className="design-controls__card" data-term-label="Scale">
          <div className="design-controls__field" style={{ marginBottom: 0 }}>
            <label>Design Scale: {Math.round(scale * 100)}%</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.05"
              value={scale}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            />
            {designDimensions && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: 12, color: "#1a1a1a" }}>
                  {designDimensions.widthCm.toFixed(1)} × {designDimensions.heightCm.toFixed(1)} cm
                </span>
                {product.measurements && (
                  <button
                    type="button"
                    onClick={() => setShowPerGarment((v) => !v)}
                    style={{
                      background: "rgba(var(--accent-rgb), 0.15)",
                      border: "none",
                      color: "var(--accent-active)",
                      borderRadius: 8,
                      padding: "4px 8px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {showPerGarment ? "Hide ▴" : "Per size ▾"}
                  </button>
                )}
              </div>
            )}
            {showPerGarment && designDimensions && product.measurements && (() => {
              const widths = product.measurements.widthBySize;
              const refSize = product.sizes.find((s) => s === "L") ?? product.sizes.find((s) => s === "M") ?? product.sizes[0];
              const refWidth = widths[refSize];
              if (!refWidth) return null;
              return (
                <div style={{ marginTop: 8, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                      gap: "4px 16px",
                    }}
                  >
                    {product.sizes.map((size) => {
                      const sw = widths[size];
                      if (!sw) return null;
                      const factor = sw / refWidth;
                      const w = designDimensions.widthCm * factor;
                      const h = designDimensions.heightCm * factor;
                      return (
                        <div key={size}>
                          <span style={{ display: "inline-block", minWidth: 32, fontWeight: 600 }}>{size}</span>
                          {w.toFixed(1)} × {h.toFixed(1)} cm
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 4, fontStyle: "italic", color: "#999" }}>
                    Print scales proportionally to garment width.
                  </div>
                </div>
              );
            })()}
          </div>
          </div>

          {/* Alignment tools */}
          <div className="design-controls__card" data-term-label="Align">
          <div className="design-controls__section-label">Align Design</div>
          <div className="design-controls__align-row">
            <button className="design-controls__align-btn" onClick={() => onAlign("left")} title="Align left">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="2" width="2" height="14" fill="currentColor" />
                <rect x="5" y="5" width="10" height="3" fill="currentColor" />
                <rect x="5" y="10" width="7" height="3" fill="currentColor" />
              </svg>
            </button>
            <button className="design-controls__align-btn" onClick={() => onAlign("center-h")} title="Center horizontally">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="8" y="2" width="2" height="14" fill="currentColor" />
                <rect x="3" y="5" width="12" height="3" fill="currentColor" />
                <rect x="5" y="10" width="8" height="3" fill="currentColor" />
              </svg>
            </button>
            <button className="design-controls__align-btn" onClick={() => onAlign("right")} title="Align right">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="15" y="2" width="2" height="14" fill="currentColor" />
                <rect x="3" y="5" width="10" height="3" fill="currentColor" />
                <rect x="6" y="10" width="7" height="3" fill="currentColor" />
              </svg>
            </button>
            <div className="design-controls__align-divider" />
            <button className="design-controls__align-btn" onClick={() => onAlign("top")} title="Align top">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="1" width="14" height="2" fill="currentColor" />
                <rect x="5" y="5" width="3" height="10" fill="currentColor" />
                <rect x="10" y="5" width="3" height="7" fill="currentColor" />
              </svg>
            </button>
            <button className="design-controls__align-btn" onClick={() => onAlign("center-v")} title="Center vertically">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="8" width="14" height="2" fill="currentColor" />
                <rect x="5" y="3" width="3" height="12" fill="currentColor" />
                <rect x="10" y="5" width="3" height="8" fill="currentColor" />
              </svg>
            </button>
            <button className="design-controls__align-btn" onClick={() => onAlign("bottom")} title="Align bottom">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="15" width="14" height="2" fill="currentColor" />
                <rect x="5" y="3" width="3" height="10" fill="currentColor" />
                <rect x="10" y="6" width="3" height="7" fill="currentColor" />
              </svg>
            </button>
          </div>

          <button
            className="btn btn--outline"
            onClick={onReset}
            style={{ width: "100%", marginBottom: 0, marginTop: 16 }}
          >
            Reset position
          </button>
          </div>
        </>
      )}

      <div className="design-controls__card design-controls__card--actions">
        <button
          className="btn btn--dark"
          onClick={onSave}
          disabled={!hasDesign || saving}
          style={{ width: "100%", marginBottom: 0 }}
        >
          {saving ? "Saving..." : isEditing ? "Update design" : "Save design"}
        </button>

        <button
          className="btn btn--primary"
          onClick={onAddToCart}
          disabled={!hasDesign}
          style={{ width: "100%" }}
        >
          Continue to recipients →
        </button>
      </div>
    </div>
  );
}
