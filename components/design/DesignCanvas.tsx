"use client";

import { useRef, useState, useCallback, useEffect } from "react";

type Props = {
  productEmoji: string;
  designImage: string | null;
  position: { x: number; y: number };
  scale: number;
  onPositionChange: (pos: { x: number; y: number }) => void;
};

export default function DesignCanvas({ productEmoji, designImage, position, scale, onPositionChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!designImage) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [designImage, position]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      onPositionChange({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, onPositionChange]);

  return (
    <div className="design-canvas" ref={containerRef}>
      <div className="design-canvas__product">{productEmoji}</div>
      <div className="design-canvas__print-area">
        {designImage ? (
          <img
            src={designImage}
            alt="Your design"
            className="design-canvas__design"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: dragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        ) : (
          <div className="design-canvas__placeholder">Your design here</div>
        )}
      </div>
    </div>
  );
}
