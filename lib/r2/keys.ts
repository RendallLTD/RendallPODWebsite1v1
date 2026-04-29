import { randomUUID } from "node:crypto";

// R2 has no row-level access control. Object keys are the gate: by embedding
// the user's id in the prefix, the presign route can refuse to sign anything
// outside the caller's own prefix. Public-read with a uuid filename is the
// same privacy model as `factory-exports`.

export type ImageExt = "png" | "jpeg";

export function designUploadKey(userId: string, ext: ImageExt): string {
  return `users/${userId}/designs/${randomUUID()}.${ext}`;
}

export function parseDesignKey(key: string): { userId: string } | null {
  const match = key.match(/^users\/([^/]+)\/designs\/[^/]+\.[a-z]+$/);
  if (!match) return null;
  return { userId: match[1]! };
}
