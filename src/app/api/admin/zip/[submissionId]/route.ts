import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { Readable } from 'node:stream';
import { ensureTables, getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { fetchBlobBuffer } from '@/lib/storage';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest, ctx: { params: Promise<{ submissionId: string }> }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { submissionId } = await ctx.params;
  await ensureTables();
  const sql = getDb();

  const subRows = await sql`SELECT id, contact_name, betrieb FROM submissions WHERE id = ${submissionId} LIMIT 1`;
  if (subRows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const files = await sql`
    SELECT id, mitarbeiter_label, kind, blob_path, file_name
    FROM submission_files
    WHERE submission_id = ${submissionId}
    ORDER BY mitarbeiter_label, kind
  `;
  if (files.length === 0) return NextResponse.json({ error: 'Keine Dateien' }, { status: 404 });

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  await sql`
    INSERT INTO admin_downloads (submission_id, kind, admin_email, ip)
    VALUES (${submissionId}, 'zip', ${auth.email}, ${ip})
  `;

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', (err) => console.error('[zip] archiver error:', err));

  // Pump in files (sequentially fetch buffers, append to archive)
  (async () => {
    try {
      for (const f of files) {
        const safeFolder = (f.mitarbeiter_label as string).replace(/[^a-zA-Z0-9_-]+/g, '_') || 'Mitarbeiter';
        const buffer = await fetchBlobBuffer(f.blob_path as string);
        archive.append(buffer, { name: `${safeFolder}/${f.file_name}` });
      }
      await archive.finalize();
    } catch (err) {
      console.error('[zip] streaming error:', err);
      archive.abort();
    }
  })();

  const firma = (subRows[0].betrieb as { firma?: string })?.firma || 'submission';
  const safeFirma = firma.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'submission';
  const fileName = `QCG_${safeFirma}_${submissionId.slice(0, 8)}.zip`;

  // Convert Node Readable to Web ReadableStream
  const webStream = Readable.toWeb(archive) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
