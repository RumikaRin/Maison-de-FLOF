import { put, del, list } from "@vercel/blob";

export interface BlobUploadOptions {
  fileName: string;
  dataUrlOrBuffer: string | Buffer;
  folder?: string;
  contentType?: string;
}

export interface BlobResource {
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  format?: string;
  createdAt: string;
}

/**
 * Vercel Blob storage helper providing full image lifecycle (upload, list, delete)
 * with graceful fallback for local development or CI when BLOB_READ_WRITE_TOKEN is not configured.
 */
export async function uploadImageToBlob(options: BlobUploadOptions): Promise<BlobResource> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const folder = options.folder ?? "flof";
  const safeName = options.fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .slice(0, 100);
  const pathname = `${folder}/${safeName}-${Date.now().toString(36)}`;

  let buffer: Buffer;
  let contentType = options.contentType ?? "image/png";

  if (typeof options.dataUrlOrBuffer === "string") {
    const matches = options.dataUrlOrBuffer.match(/^data:(image\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
    if (matches) {
      contentType = matches[1];
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(options.dataUrlOrBuffer);
    }
  } else {
    buffer = options.dataUrlOrBuffer;
  }

  if (token) {
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
      token,
    });

    return {
      publicId: blob.pathname,
      url: blob.url,
      createdAt: new Date().toISOString(),
    };
  }

  // Fallback for local development or testing when BLOB_READ_WRITE_TOKEN is not present
  const mockUrl = `/uploads/${pathname}.png`;
  return {
    publicId: pathname,
    url: mockUrl,
    createdAt: new Date().toISOString(),
  };
}

export async function listBlobImages(prefix = "flof/"): Promise<BlobResource[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return [];
  }

  const { blobs } = await list({ prefix, token });
  return blobs.map((b) => ({
    publicId: b.pathname,
    url: b.url,
    createdAt: b.uploadedAt.toISOString(),
  }));
}

export async function deleteBlobImage(urlOrPath: string): Promise<{ success: boolean }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    await del(urlOrPath, { token });
  }
  return { success: true };
}
