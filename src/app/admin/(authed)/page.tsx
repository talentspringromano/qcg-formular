import Link from 'next/link';
import { ensureTables, getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SubmissionRow = {
  id: string;
  created_at: string;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  betrieb: { firma?: string; branche?: string } | null;
  mitarbeiter_count: number;
  file_count: number;
};

async function loadSubmissions(): Promise<SubmissionRow[]> {
  await ensureTables();
  const sql = getDb();
  const rows = await sql`
    SELECT
      s.id::text AS id,
      s.created_at,
      s.status,
      s.contact_name,
      s.contact_email,
      s.betrieb,
      jsonb_array_length(s.app_data->'mitarbeiter') AS mitarbeiter_count,
      (SELECT count(*) FROM submission_files f WHERE f.submission_id = s.id)::int AS file_count
    FROM submissions s
    ORDER BY s.created_at DESC
    LIMIT 200
  `;
  return rows as unknown as SubmissionRow[];
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default async function AdminListPage() {
  const subs = await loadSubmissions();

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-ink mb-2">Eingegangene Anträge</h1>
      <p className="text-ink-mute mb-6 text-sm">{subs.length} Antrag/Anträge — neueste zuerst.</p>

      {subs.length === 0 ? (
        <div className="qcg-card p-7 text-center text-ink-mute">
          Noch keine Einträge. Sobald jemand das Formular abschickt, erscheint er hier.
        </div>
      ) : (
        <div className="bg-white border border-mint-200 rounded-[18px] overflow-hidden shadow-[var(--shadow-sm)]">
          <table className="w-full text-sm">
            <thead className="bg-mint-50 text-ink-mute">
              <tr>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-[0.06em] text-[11px]">Datum</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-[0.06em] text-[11px]">Firma</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-[0.06em] text-[11px]">Ansprechpartner</th>
                <th className="text-right px-4 py-3 font-semibold uppercase tracking-[0.06em] text-[11px]">Mitarbeiter</th>
                <th className="text-right px-4 py-3 font-semibold uppercase tracking-[0.06em] text-[11px]">Dateien</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-mint-100 hover:bg-mint-50/50">
                  <td className="px-4 py-3 text-ink whitespace-nowrap">{fmtDate(s.created_at)}</td>
                  <td className="px-4 py-3 text-ink font-medium">{s.betrieb?.firma || '—'}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.contact_name || '—'}</td>
                  <td className="px-4 py-3 text-right text-ink">{s.mitarbeiter_count}</td>
                  <td className="px-4 py-3 text-right text-ink">{s.file_count}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/${s.id}`} className="text-green-800 hover:text-green-900 font-medium">
                      Ansehen →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
