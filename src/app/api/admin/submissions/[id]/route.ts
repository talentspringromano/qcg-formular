import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { deleteBlob } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  await ensureTables();
  const sql = getDb();

  const subRows = await sql`
    SELECT id, created_at, status, betrieb, app_data, contact_name, contact_email, ip, user_agent, notes
    FROM submissions
    WHERE id = ${id}
    LIMIT 1
  `;
  if (subRows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const fileRows = await sql`
    SELECT id, mitarbeiter_id, mitarbeiter_label, kind, file_name, size_bytes, created_at
    FROM submission_files
    WHERE submission_id = ${id}
    ORDER BY mitarbeiter_label, kind
  `;

  return NextResponse.json({ ok: true, submission: subRows[0], files: fileRows });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const sql = getDb();

  const files = await sql`SELECT blob_url FROM submission_files WHERE submission_id = ${id}`;

  await Promise.all(files.map((f) => deleteBlob(f.blob_url as string)));

  await sql`DELETE FROM submissions WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
