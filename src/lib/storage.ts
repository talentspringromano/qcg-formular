import { put, del, list, get } from '@vercel/blob';

export type UploadedBlob = {
  url: string;
  pathname: string;
  size: number;
};

export async function uploadPdf(path: string, buffer: Buffer | Uint8Array): Promise<UploadedBlob> {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const blob = await put(path, buf, {
    access: 'private',
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

/**
 * Returns a ReadableStream of the blob bytes for a private blob.
 * Caller must consume the stream.
 */
export async function getPrivateBlobStream(urlOrPathname: string): Promise<ReadableStream<Uint8Array>> {
  const result = await get(urlOrPathname, {
    access: 'private',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error('Blob not found or unreadable');
  }
  return result.stream;
}

export async function fetchBlobBuffer(urlOrPathname: string): Promise<Buffer> {
  const result = await get(urlOrPathname, {
    access: 'private',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error('Blob not found or unreadable');
  }
  const reader = result.stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return Buffer.from(out);
}
