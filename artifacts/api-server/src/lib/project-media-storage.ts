import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export type StoredProjectMedia = {
  objectPath: string;
  filename: string;
  storage: "supabase" | "local";
};

export const PROJECT_MEDIA_MAX_BYTES = 100 * 1024 * 1024;
export const PROJECT_MEDIA_BUCKET = process.env.LENA_PROJECT_MEDIA_BUCKET || "lena-project-media";
const PROJECT_MEDIA_PREFIX = "projects/";
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "uploads");

export const PROJECT_MEDIA_MIME_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
  ["video/ogg", ".ogv"],
]);

export class ProjectMediaStorageError extends Error {
  constructor(message: string, public readonly statusCode = 500) {
    super(message);
  }
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function getSupabaseStorageConfig() {
  const url = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return undefined;
  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

function extensionFor(file: Express.Multer.File) {
  const ext = PROJECT_MEDIA_MIME_EXTENSIONS.get(file.mimetype);
  if (!ext) {
    throw new ProjectMediaStorageError("Unsupported file type.", 415);
  }
  return ext;
}

function assertUploadable(file: Express.Multer.File) {
  extensionFor(file);
  if (file.size > PROJECT_MEDIA_MAX_BYTES) {
    throw new ProjectMediaStorageError("File exceeds the 100MB upload limit.", 413);
  }
  if (!file.buffer?.byteLength) {
    throw new ProjectMediaStorageError("No file uploaded.", 400);
  }
}

function publicObjectUrl(baseUrl: string, bucket: string, objectPath: string) {
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}

async function storeInSupabase(file: Express.Multer.File, config: { url: string; serviceRoleKey: string }) {
  const ext = extensionFor(file);
  const filename = `${randomUUID()}${ext}`;
  const objectPath = `${PROJECT_MEDIA_PREFIX}${filename}`;
  const response = await fetch(
    `${config.url}/storage/v1/object/${encodeURIComponent(PROJECT_MEDIA_BUCKET)}/${objectPath}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.serviceRoleKey}`,
        apikey: config.serviceRoleKey,
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": file.mimetype,
        "x-upsert": "false",
      },
      body: file.buffer,
    },
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new ProjectMediaStorageError(
      details.includes("Bucket not found")
        ? "Project media storage bucket is not configured."
        : "Upload failed. Please verify the media storage integration.",
      response.status,
    );
  }

  return {
    objectPath: publicObjectUrl(config.url, PROJECT_MEDIA_BUCKET, objectPath),
    filename,
    storage: "supabase" as const,
  };
}

async function storeLocally(file: Express.Multer.File) {
  const ext = extensionFor(file);
  const digest = createHash("sha256").update(file.buffer).digest("hex").slice(0, 12);
  const filename = `${randomUUID()}-${digest}${ext}`;
  await mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOADS_DIR, filename), file.buffer, { flag: "wx" });
  return { objectPath: `/api/uploads/${filename}`, filename, storage: "local" as const };
}

export async function storeProjectMedia(file: Express.Multer.File): Promise<StoredProjectMedia> {
  assertUploadable(file);

  const supabaseConfig = getSupabaseStorageConfig();
  if (supabaseConfig) return storeInSupabase(file, supabaseConfig);

  if (isProductionRuntime()) {
    throw new ProjectMediaStorageError("Project media storage is not configured for production.", 503);
  }

  return storeLocally(file);
}
