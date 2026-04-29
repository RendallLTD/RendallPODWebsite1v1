import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforce, limiters } from "@/lib/ratelimit";
import { presignPut, publicUrl } from "@/lib/r2/client";
import { designUploadKey, type ImageExt } from "@/lib/r2/keys";

export const runtime = "nodejs";

const MAX_BYTES = 50 * 1024 * 1024;

const MIME_TO_EXT: Record<string, ImageExt> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
};

type Body = { contentType?: unknown; contentLength?: unknown };

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const limited = await enforce(limiters.uploadPresign, `upload-presign:${user.id}`);
  if (limited) return limited;

  const body = (await request.json().catch(() => null)) as Body | null;
  const contentType = typeof body?.contentType === "string" ? body.contentType : null;
  const contentLength = typeof body?.contentLength === "number" ? body.contentLength : null;

  if (!contentType || !(contentType in MIME_TO_EXT)) {
    return Response.json({ error: "contentType must be image/png or image/jpeg" }, { status: 400 });
  }
  if (!contentLength || !Number.isFinite(contentLength) || contentLength <= 0) {
    return Response.json({ error: "contentLength required" }, { status: 400 });
  }
  if (contentLength > MAX_BYTES) {
    return Response.json({ error: `file too large; max ${MAX_BYTES} bytes` }, { status: 413 });
  }

  const ext = MIME_TO_EXT[contentType]!;
  const key = designUploadKey(user.id, ext);
  const expiresIn = 300;

  let uploadUrl: string;
  try {
    uploadUrl = await presignPut(key, contentType, contentLength, expiresIn);
  } catch (err) {
    console.error("[uploads/sign] presign failed", {
      userId: user.id,
      err: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "presign failed" }, { status: 500 });
  }

  return Response.json({
    uploadUrl,
    publicUrl: publicUrl(key),
    key,
    expiresIn,
  });
}
