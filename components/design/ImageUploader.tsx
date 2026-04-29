"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  onImageUpload: (url: string) => void;
};

const MAX_BYTES = 50 * 1024 * 1024;

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

type SignResponse = { uploadUrl: string; publicUrl: string; key: string; expiresIn: number };

async function requestPresign(contentType: string, contentLength: number): Promise<SignResponse> {
  const res = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentType, contentLength }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `presign failed (${res.status})`);
  }
  return (await res.json()) as SignResponse;
}

async function putToR2(uploadUrl: string, file: File, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: file,
  });
  if (!res.ok) throw new Error(`upload failed (${res.status})`);
}

type UploadPhase = "idle" | "signing" | "uploading" | "done";

export default function ImageUploader({ onImageUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("idle");

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!rightsConfirmed) {
        setError("Please confirm you have rights to use this image before uploading.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("File too large. Max 50MB.");
        return;
      }
      const mime = await detectMime(file);
      if (!mime) {
        setError("Only PNG and JPEG images are accepted.");
        return;
      }

      try {
        setPhase("signing");
        const { uploadUrl, publicUrl } = await requestPresign(mime, file.size);

        setPhase("uploading");
        try {
          await putToR2(uploadUrl, file, mime);
        } catch (firstErr) {
          // One retry on transient network failure.
          await putToR2(uploadUrl, file, mime).catch(() => {
            throw firstErr;
          });
        }

        setPhase("done");
        onImageUpload(publicUrl);
      } catch (err) {
        setPhase("idle");
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    },
    [onImageUpload, rightsConfirmed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const busy = phase === "signing" || phase === "uploading";
  const busyLabel = phase === "signing" ? "Preparing upload…" : phase === "uploading" ? "Uploading…" : null;

  return (
    <div>
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 14px",
          marginBottom: 12,
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: rightsConfirmed ? "rgba(0,128,0,0.04)" : "rgba(255,165,0,0.06)",
          cursor: "pointer",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <input
          type="checkbox"
          checked={rightsConfirmed}
          onChange={(e) => setRightsConfirmed(e.target.checked)}
          style={{ marginTop: 3, flexShrink: 0 }}
        />
        <span>
          I confirm that I own this image, or I have explicit permission from the rights holder to reproduce and sell it. I understand that uploading content that infringes copyright, trademarks, or other intellectual property rights may result in order cancellation and account termination, and that Rendall&apos;s <a href="/dmca" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ textDecoration: "underline" }}>takedown procedure</a> applies.
        </span>
      </label>
      <div
        className="uploader"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => {
          if (busy) return;
          if (!rightsConfirmed) {
            setError("Please confirm you have rights to use this image before uploading.");
            return;
          }
          inputRef.current?.click();
        }}
        style={{ opacity: rightsConfirmed && !busy ? 1 : 0.55, cursor: rightsConfirmed && !busy ? "pointer" : "not-allowed" }}
        aria-disabled={!rightsConfirmed || busy}
        aria-busy={busy}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          hidden
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <div className="uploader__icon">🎨</div>
        <p className="uploader__text">
          {busyLabel ?? "Drag & drop your design here"}
        </p>
        <p className="uploader__sub">or click to browse (PNG or JPEG — max 50MB)</p>
        {error && <p className="uploader__error" style={{ color: "#c00", marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  );
}
