import { NextRequest, NextResponse } from 'next/server';
import { redeemFileToken } from '@/lib/fileTokens';
import { getPrivateBlobStream } from '@/lib/storage';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NOT_FOUND = NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const userAgent = req.headers.get('user-agent') || null;

  const file = await redeemFileToken(token, ip, userAgent);
  if (!file) return NOT_FOUND;

  // Backend proxy: fetch the private blob server-side via the SDK (auth via
  // BLOB_READ_WRITE_TOKEN), then stream to the client. The Blob URL never
  // leaves our origin and is unusable without our token.
  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await getPrivateBlobStream(file.blobPath);
  } catch (err) {
    console.error('[internal-file] blob fetch failed', { blobPath: file.blobPath, err });
    return NextResponse.json({ error: 'Datei nicht abrufbar' }, { status: 502 });
  }

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
