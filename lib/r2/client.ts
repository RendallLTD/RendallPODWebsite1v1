import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";

// Server-only R2 client. R2 speaks the S3 API, so we use the AWS SDK with
// R2's account-scoped endpoint. Never import from a client component — this
// file holds the secret key. Bucket is a per-call argument so the same client
// can serve multiple buckets (designs, factory exports).

let cached: S3Client | null = null;

function getClient(): S3Client {
  if (cached) return cached;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
  }
  cached = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cached;
}

export async function presignPut(
  bucket: string,
  key: string,
  contentType: string,
  contentLength: number,
  expiresIn = 300,
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(getClient(), cmd, { expiresIn });
}

export async function presignGet(
  bucket: string,
  key: string,
  expiresIn = 300,
): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(getClient(), cmd, { expiresIn });
}

export async function serverPutObject(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await getClient().send(cmd);
}

export async function getObjectBuffer(bucket: string, key: string): Promise<Buffer> {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await getClient().send(cmd);
  const body = res.Body as Readable | undefined;
  if (!body) throw new Error(`R2 GetObject returned no body for ${bucket}/${key}`);
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}

export function publicUrl(base: string, key: string): string {
  return `${base.replace(/\/+$/, "")}/${key}`;
}
