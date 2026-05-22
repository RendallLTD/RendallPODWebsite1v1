"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";

type Props = {
  onImageUpload: (url: string) => void;
  /** When true, the visible drop zone is hidden — uploads happen only via the imperative
   *  handle (openPicker()), useful in bulk mode where the right panel drives uploads. */
  hidden?: boolean;
};

export type ImageUploaderHandle = {
  openPicker: () => void;
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

const ImageUploader = forwardRef<ImageUploaderHandle, Props>(function ImageUploader(
  { onImageUpload, hidden = false }: Props,
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [showRightsModal, setShowRightsModal] = useState(false);
  const pendingDropRef = useRef<File | null>(null);

  useImperativeHandle(ref, () => ({
    openPicker: () => {
      if (phase === "signing" || phase === "uploading") return;
      if (!rightsConfirmed) {
        setShowRightsModal(true);
        return;
      }
      inputRef.current?.click();
    },
  }), [phase, rightsConfirmed]);

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
      if (!file) return;
      if (!rightsConfirmed) {
        pendingDropRef.current = file;
        setShowRightsModal(true);
        return;
      }
      void handleFile(file);
    },
    [handleFile, rightsConfirmed]
  );

  const acceptRights = useCallback(() => {
    setRightsConfirmed(true);
    setShowRightsModal(false);
    const pending = pendingDropRef.current;
    pendingDropRef.current = null;
    if (pending) {
      void handleFile(pending);
    } else {
      // No pending drop — open file picker
      inputRef.current?.click();
    }
  }, [handleFile]);

  const busy = phase === "signing" || phase === "uploading";
  const busyLabel = phase === "signing" ? "Preparing upload…" : phase === "uploading" ? "Uploading…" : null;

  return (
    <div>
      <div
        className="uploader"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => {
          if (busy) return;
          if (!rightsConfirmed) {
            setShowRightsModal(true);
            return;
          }
          inputRef.current?.click();
        }}
        style={{
          display: hidden ? "none" : undefined,
          opacity: busy ? 0.55 : 1,
          cursor: busy ? "not-allowed" : "pointer",
        }}
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

      {showRightsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rights-modal-title"
          onClick={() => setShowRightsModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              maxWidth: 520,
              width: "100%",
              padding: 28,
              borderRadius: 8,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h2 id="rights-modal-title" style={{ margin: 0, marginBottom: 16, fontSize: 20, fontWeight: 700 }}>
              Confirm image rights
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 24, color: "#1a1a1a" }}>
              I confirm that I own this image, or I have explicit permission from the rights holder to reproduce and sell it. I understand that uploading content that infringes copyright, trademarks, or other intellectual property rights may result in order cancellation and account termination, and that Rendall&apos;s{" "}
              <a href="/dmca" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                takedown procedure
              </a>{" "}
              applies.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                className="btn btn--outline"
                onClick={() => {
                  pendingDropRef.current = null;
                  setShowRightsModal(false);
                }}
                style={{ padding: "10px 20px" }}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={acceptRights}
                style={{ padding: "10px 20px" }}
              >
                I agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ImageUploader;
