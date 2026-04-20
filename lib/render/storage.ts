import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "factory-exports";

/**
 * Upload a PNG buffer to the public `factory-exports` bucket and return the
 * permanent public URL. Uses the service-role admin client — callers must be
 * running on a server route.
 *
 * Overwrites on collision (upsert: true) so a re-render of the same order_item
 * replaces the previous output at the same stable URL.
 */
export async function uploadPng(path: string, buffer: Buffer): Promise<string> {
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });
  if (error) {
    throw new Error(`Storage upload failed for ${path}: ${error.message}`);
  }
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
