import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  await ensureTables();
  const sql = getDb();

  const rows = await sql`
    SELECT
      s.id,
      s.created_at,
      s.status,
      s.contact_name,
      s.contact_email,
      s.betrieb,
      jsonb_array_length(s.app_data->'mitarbeiter') AS mitarbeiter_count,
      (SELECT count(*) FROM submission_files f WHERE f.submission_id = s.id) AS file_count
    FROM submissions s
    ORDER BY s.created_at DESC
    LIMIT 200
  `;

  return NextResponse.json({ ok: true, submissions: rows });
}
