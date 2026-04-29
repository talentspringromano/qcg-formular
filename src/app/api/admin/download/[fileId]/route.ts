import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getPrivateBlobStream } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ fileId: string }> }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { fileId } = await ctx.params;
  await ensureTables();
  const sql = getDb();

  const rows = await sql`
    SELECT id, submission_id, kind, blob_path, file_name
    FROM submission_files
    WHERE id = ${fileId}
    LIMIT 1
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const file = rows[0];

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;

  await sql`
    INSERT INTO admin_downloads (file_id, submission_id, kind, admin_email, ip)
    VALUES (${file.id}, ${file.submission_id}, ${file.kind}, ${auth.email}, ${ip})
  `;

  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await getPrivateBlobStream(file.blob_path as string);
  } catch (err) {
    console.error('[admin-download] blob fetch failed', { blobPath: file.blob_path, err });
    return NextResponse.json({ error: 'Datei nicht abrufbar' }, { status: 502 });
  }

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file.file_name}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
