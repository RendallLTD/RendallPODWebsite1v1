"use client";

import { useCallback, useRef } from "react";

type Props = {
  onImageUpload: (dataUrl: string) => void;
};

export default function ImageUploader({ onImageUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Max 50MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onImageUpload(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className="uploader"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className="uploader__icon">🎨</div>
      <p className="uploader__text">Drag & drop your design here</p>
      <p className="uploader__sub">or click to browse (PNG, JPG, SVG — max 50MB)</p>
    </div>
  );
}
