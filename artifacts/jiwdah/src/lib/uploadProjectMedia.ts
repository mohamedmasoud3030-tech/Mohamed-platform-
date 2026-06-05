type SignedUploadResponse = {
  objectPath: string;
  publicUrl: string;
  signedUrl: string;
  token: string;
};

export async function uploadProjectMedia(file: File) {
  const authorize = await fetch("/api/upload/sign", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mimeType: file.type, size: file.size }),
  });
  const authorization = await authorize.json() as SignedUploadResponse | { error?: string };
  if (!authorize.ok || !("signedUrl" in authorization)) {
    throw new Error("error" in authorization ? authorization.error || "Upload authorization failed" : "Upload authorization failed");
  }

  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);
  const upload = await fetch(authorization.signedUrl, {
    method: "PUT",
    headers: { "x-upsert": "false" },
    body,
  });
  if (!upload.ok) throw new Error("Upload failed. Please try again.");
  return authorization.publicUrl;
}
