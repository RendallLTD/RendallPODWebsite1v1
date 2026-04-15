"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  onImageUpload: (dataUrl: string) => void;
};

const MAX_BYTES = 10 * 1024 * 1024;

// Verify the file's actual content matches an allowed image type by reading
// the first bytes (magic numbers). Defense against a renamed .png that's
// actually an HTML/JS/SVG payload.
async function detectMime(file: File): Promise<"image/png" | "image/jpeg" | null> {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  // PNG: 89 50 4E 47
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

export default function ImageUploader({ onImageUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > MAX_BYTES) {
        setError("File too large. Max 10MB.");
        return;
      }
      const mime = await detectMime(file);
      if (!mime) {
        setError("Only PNG and JPEG images are accepted.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) onImageUpload(e.target.result as string);
      };
      reader.onerror = () => setError("Failed to read file.");
      reader.readAsDataURL(file);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

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
        accept="image/png,image/jpeg"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <div className="uploader__icon">🎨</div>
      <p className="uploader__text">Drag & drop your design here</p>
      <p className="uploader__sub">or click to browse (PNG or JPEG — max 10MB)</p>
      {error && <p className="uploader__error" style={{ color: "#c00", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
