import { put, del, list } from '@vercel/blob';

export type UploadedBlob = {
  url: string;
  pathname: string;
  size: number;
};

export async function uploadPdf(path: string, buffer: Buffer | Uint8Array): Promise<UploadedBlob> {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const blob = await put(path, buf, {
    access: 'public',
    contentType: 'application/pdf',
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return {
    url: blob.url,
    pathname: blob.pathname,
    size: buffer.byteLength,
  };
}

export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch (err) {
    console.error('Blob delete failed:', err);
  }
}

export async function listBlobsUnderPrefix(prefix: string) {
  return list({ prefix, token: process.env.BLOB_READ_WRITE_TOKEN });
}

export async function fetchBlobBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: process.env.BLOB_READ_WRITE_TOKEN
      ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
      : {},
  });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
