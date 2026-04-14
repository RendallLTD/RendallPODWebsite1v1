"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { PrintAreaSpec, PrintAreaOverlay } from "@/lib/products";

export type DesignLayer = {
  id: string;
  image: string;
  position: { x: number; y: number };
  scale: number;
};

type Props = {
  productPhoto: string | undefined;
  layers: DesignLayer[];
  activeLayerId: string | null;
  printSpec: PrintAreaSpec | undefined;
  onLayerPositionChange: (layerId: string, pos: { x: number; y: number }) => void;
  onSelectLayer: (layerId: string) => void;
  onDesignRenderedSize: (size: { w: number; h: number } | null) => void;
  previewMode: boolean;
};

const DEFAULT_OVERLAY: PrintAreaOverlay = {
  left: 0.25,
  top: 0.18,
  width: 0.50,
  height: 0.55,
};

export default function DesignCanvas({
  productPhoto,
  layers,
  activeLayerId,
  printSpec,
  onLayerPositionChange,
  onSelectLayer,
  onDesignRenderedSize,
  previewMode,
}: Props) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posAtDragStart = useRef({ x: 0, y: 0 });
  const dragLayerId = useRef<string | null>(null);
  // Track natural sizes per layer
  const [naturalSizes, setNaturalSizes] = useState<Record<string, { w: number; h: number }>>({});

  const overlay = printSpec?.overlay ?? DEFAULT_OVERLAY;

  const getLayerRenderedSize = useCallback(
    (layer: DesignLayer) => {
      const pa = printAreaRef.current;
      const ns = naturalSizes[layer.id];
      if (!pa || !ns) return null;
      const paW = pa.clientWidth;
      const paH = pa.clientHeight;
      const aspect = ns.w / ns.h;
      let renderW: number;
      let renderH: number;
      if (aspect > paW / paH) {
        renderW = paW;
        renderH = paW / aspect;
      } else {
        renderH = paH;
        renderW = paH * aspect;
      }
      return { w: renderW * layer.scale, h: renderH * layer.scale };
    },
    [naturalSizes]
  );

  // Report active layer's rendered size
  useEffect(() => {
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (activeLayer) {
      onDesignRenderedSize(getLayerRenderedSize(activeLayer));
    } else {
      onDesignRenderedSize(null);
    }
  }, [layers, activeLayerId, getLayerRenderedSize, onDesignRenderedSize]);

  const clampPosition = useCallback(
    (pos: { x: number; y: number }, layerId: string): { x: number; y: number } => {
      const pa = printAreaRef.current;
      const layer = layers.find((l) => l.id === layerId);
      if (!pa || !layer) return pos;
      const rendered = getLayerRenderedSize(layer);
      if (!rendered) return pos;

      const paW = pa.clientWidth;
      const paH = pa.clientHeight;

      const maxX = Math.max(0, (paW - rendered.w) / 2);
      const maxY = Math.max(0, (paH - rendered.h) / 2);

      return {
        x: Math.max(-maxX, Math.min(maxX, pos.x)),
        y: Math.max(-maxY, Math.min(maxY, pos.y)),
      };
    },
    [getLayerRenderedSize, layers]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, layerId: string) => {
      if (previewMode) return;
      e.preventDefault();
      e.stopPropagation();
      onSelectLayer(layerId);
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      const layer = layers.find((l) => l.id === layerId);
      posAtDragStart.current = layer ? { ...layer.position } : { x: 0, y: 0 };
      dragLayerId.current = layerId;
    },
    [previewMode, onSelectLayer, layers]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, layerId: string) => {
      if (previewMode) return;
      e.stopPropagation();
      onSelectLayer(layerId);
      const touch = e.touches[0];
      setDragging(true);
      dragStart.current = { x: touch.clientX, y: touch.clientY };
      const layer = layers.find((l) => l.id === layerId);
      posAtDragStart.current = layer ? { ...layer.position } : { x: 0, y: 0 };
      dragLayerId.current = layerId;
    },
    [previewMode, onSelectLayer, layers]
  );

  useEffect(() => {
    if (!dragging || !dragLayerId.current) return;
    const lid = dragLayerId.current;

    const handleMove = (clientX: number, clientY: number) => {
      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;
      const newPos = {
        x: posAtDragStart.current.x + dx,
        y: posAtDragStart.current.y + dy,
      };
      onLayerPositionChange(lid, clampPosition(newPos, lid));
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleUp = () => {
      setDragging(false);
      dragLayerId.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [dragging, clampPosition, onLayerPositionChange]);

  const getLayerStyle = (layer: DesignLayer): React.CSSProperties => {
    const pa = printAreaRef.current;
    const ns = naturalSizes[layer.id];
    if (!pa || !ns) return {};
    const paW = pa.clientWidth;
    const paH = pa.clientHeight;
    const aspect = ns.w / ns.h;

    let renderW: number;
    let renderH: number;
    if (aspect > paW / paH) {
      renderW = paW;
      renderH = paW / aspect;
    } else {
      renderH = paH;
      renderW = paH * aspect;
    }

    const isActive = layer.id === activeLayerId && !previewMode;
    const isDraggingThis = dragging && dragLayerId.current === layer.id;

    return {
      width: renderW,
      height: renderH,
      transform: `translate(${layer.position.x}px, ${layer.position.y}px) scale(${layer.scale})`,
      cursor: previewMode ? "default" : isDraggingThis ? "grabbing" : "grab",
      position: "absolute",
      outline: isActive ? "2px solid rgba(255, 93, 53, 0.8)" : "none",
      outlineOffset: "2px",
      zIndex: isActive ? 10 : 1,
    };
  };

  // Dimension label for active layer
  let dimensionLabel = "";
  if (printSpec && activeLayerId) {
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (activeLayer) {
      const pa = printAreaRef.current;
      const ns = naturalSizes[activeLayer.id];
      if (pa && ns) {
        const paW = pa.clientWidth;
        const paH = pa.clientHeight;
        const aspect = ns.w / ns.h;
        let renderW: number;
        let renderH: number;
        if (aspect > paW / paH) {
          renderW = paW;
          renderH = paW / aspect;
        } else {
          renderH = paH;
          renderW = paH * aspect;
        }
        const pxPerMmW = paW / printSpec.widthMm;
        const pxPerMmH = paH / printSpec.heightMm;
        const designWidthMm = (renderW * activeLayer.scale) / pxPerMmW;
        const designHeightMm = (renderH * activeLayer.scale) / pxPerMmH;
        dimensionLabel = `${(designWidthMm / 10).toFixed(1)} × ${(designHeightMm / 10).toFixed(1)} cm`;
      }
    }
  }

  return (
    <div className="design-canvas">
      {productPhoto ? (
        <img
          src={productPhoto}
          alt="Product"
          className="design-canvas__product-photo"
          draggable={false}
        />
      ) : (
        <div className="design-canvas__product">👕</div>
      )}

      <div
        className={`design-canvas__print-area ${previewMode ? "design-canvas__print-area--preview" : ""}`}
        ref={printAreaRef}
        style={{
          left: `${overlay.left * 100}%`,
          top: `${overlay.top * 100}%`,
          width: `${overlay.width * 100}%`,
          height: `${overlay.height * 100}%`,
        }}
      >
        {layers.map((layer) => (
          <img
            key={layer.id}
            src={layer.image}
            alt="Design layer"
            className="design-canvas__design"
            style={getLayerStyle(layer)}
            onMouseDown={(e) => handleMouseDown(e, layer.id)}
            onTouchStart={(e) => handleTouchStart(e, layer.id)}
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              setNaturalSizes((prev) => ({
                ...prev,
                [layer.id]: { w: img.naturalWidth, h: img.naturalHeight },
              }));
            }}
          />
        ))}

        {layers.length === 0 && !previewMode && (
          <div className="design-canvas__placeholder">Upload a design to preview</div>
        )}

        {!previewMode && printSpec && (
          <div className="design-canvas__print-label">
            Print area: {Math.round(printSpec.widthMm / 10)} × {Math.round(printSpec.heightMm / 10)} cm
          </div>
        )}

        {!previewMode && dimensionLabel && (
          <div className="design-canvas__dimension-label">
            Design: {dimensionLabel}
          </div>
        )}
      </div>
    </div>
  );
}
