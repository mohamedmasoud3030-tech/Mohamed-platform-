import { randomUUID } from "crypto";

export const PROJECT_MEDIA_MAX_BYTES = 100 * 1024 * 1024;
export const PROJECT_MEDIA_BUCKET = "lena-project-media";
const PROJECT_MEDIA_PREFIX = "projects/";

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

export type SignedProjectMediaUpload = {
  objectPath: string;
  publicUrl: string;
  signedUrl: string;
  token: string;
};

export class ProjectMediaStorageError extends Error {
  constructor(message: string, public readonly statusCode = 500) {
    super(message);
  }
}

function getSupabaseStorageConfig() {
  const url = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new ProjectMediaStorageError("Project media storage is not configured for production.", 503);
  }
  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

function extensionFor(mimeType: string) {
  const ext = PROJECT_MEDIA_MIME_EXTENSIONS.get(mimeType);
  if (!ext) throw new ProjectMediaStorageError("Unsupported file type.", 415);
  return ext;
}

function assertUploadable(mimeType: string, size: number) {
  extensionFor(mimeType);
  if (!Number.isInteger(size) || size <= 0) throw new ProjectMediaStorageError("No file uploaded.", 400);
  if (size > PROJECT_MEDIA_MAX_BYTES) throw new ProjectMediaStorageError("File exceeds the 100MB upload limit.", 413);
}

function publicObjectUrl(baseUrl: string, objectPath: string) {
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/public/${PROJECT_MEDIA_BUCKET}/${encodedPath}`;
}

export async function createSignedProjectMediaUpload(mimeType: string, size: number): Promise<SignedProjectMediaUpload> {
  assertUploadable(mimeType, size);
  const { url, serviceRoleKey } = getSupabaseStorageConfig();
  const objectPath = `${PROJECT_MEDIA_PREFIX}${randomUUID()}${extensionFor(mimeType)}`;
  const response = await fetch(`${url}/storage/v1/object/upload/sign/${PROJECT_MEDIA_BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ upsert: false }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new ProjectMediaStorageError(
      details.includes("Bucket not found")
        ? "Project media storage bucket is not configured."
        : "Upload authorization failed. Please verify the media storage integration.",
      response.status,
    );
  }

  const payload = await response.json() as { url?: string; token?: string };
  if (!payload.url || !payload.token) throw new ProjectMediaStorageError("Upload authorization failed.", 502);

  return {
    objectPath,
    publicUrl: publicObjectUrl(url, objectPath),
    signedUrl: payload.url.startsWith("http") ? payload.url : `${url}${payload.url}`,
    token: payload.token,
  };
}

export async function storeProjectMedia(_file: Express.Multer.File): Promise<never> {
  throw new ProjectMediaStorageError("Proxied media uploads are disabled. Use direct upload authorization.", 410);
}
