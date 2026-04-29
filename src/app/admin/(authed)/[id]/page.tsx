import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ensureTables, getDb } from '@/lib/db';
import type { AppData, MitarbeiterData } from '@/types/form';
import { getVertical, summary } from '@/lib/modules';
import DeleteSubmissionButton from './DeleteSubmissionButton';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SubmissionRow = {
  id: string;
  created_at: string;
  status: string;
  betrieb: AppData['betrieb'];
  app_data: AppData;
  contact_name: string | null;
  contact_email: string | null;
  ip: string | null;
  user_agent: string | null;
  notes: string | null;
};

type FileRow = {
  id: string;
  mitarbeiter_id: string;
  mitarbeiter_label: string;
  kind: 'erhebungsbogen' | 'angebot';
  file_name: string;
  size_bytes: number | null;
  created_at: string;
};

async function loadDetail(id: string): Promise<{ sub: SubmissionRow; files: FileRow[] } | null> {
  await ensureTables();
  const sql = getDb();
  const subRows = await sql`
    SELECT id::text, created_at, status, betrieb, app_data, contact_name, contact_email, ip, user_agent, notes
    FROM submissions WHERE id = ${id} LIMIT 1
  `;
  if (subRows.length === 0) return null;
  const fileRows = await sql`
    SELECT id::text, mitarbeiter_id, mitarbeiter_label, kind, file_name, size_bytes, created_at
    FROM submission_files
    WHERE submission_id = ${id}
    ORDER BY mitarbeiter_label, kind
  `;
  return { sub: subRows[0] as unknown as SubmissionRow, files: fileRows as unknown as FileRow[] };
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function fmtPreis(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
}

export default async function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadDetail(id);
  if (!data) return notFound();
  const { sub, files } = data;
  const filesByMit: Record<string, FileRow[]> = {};
  for (const f of files) {
    (filesByMit[f.mitarbeiter_id] ||= []).push(f);
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-green-800 hover:text-green-900">← Liste</Link>

      <div className="mt-3 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-ink">{sub.betrieb?.firma || 'Unbenannte Firma'}</h1>
          <p className="text-ink-mute text-sm">Eingegangen {fmtDate(sub.created_at)} · ID {sub.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/admin/zip/${sub.id}`}
            className="qcg-btn-ghost"
          >
            Alles als ZIP
          </a>
          <DeleteSubmissionButton id={sub.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="qcg-card p-5">
          <div className="qcg-label mb-2">Betrieb</div>
          <dl className="text-sm space-y-1">
            <Field label="Firma" value={sub.betrieb?.firma} />
            <Field label="Branche" value={sub.betrieb?.branche} />
            <Field label="Anschrift" value={sub.betrieb?.firmaAnschrift} />
            <Field label="Ansprechpartner" value={sub.betrieb?.ansprechpartner} />
            <Field label="Telefon" value={sub.betrieb?.firmaTelefon} />
            <Field label="Anzahl SV-Mitarbeiter" value={sub.betrieb?.anzahlMitarbeiter} />
            <Field label="Betriebs-Nr." value={sub.betrieb?.betriebsNr} />
          </dl>
        </div>
        <div className="qcg-card p-5">
          <div className="qcg-label mb-2">Meta</div>
          <dl className="text-sm space-y-1">
            <Field label="Status" value={sub.status} />
            <Field label="Eingangs-IP" value={sub.ip} />
            <Field label="User-Agent" value={sub.user_agent} mono />
          </dl>
        </div>
      </div>

      <h2 className="font-serif text-2xl font-medium text-ink mb-4">Mitarbeiter</h2>

      <div className="space-y-4">
        {sub.app_data.mitarbeiter.map((m: MitarbeiterData, i: number) => {
          const label = `${m.vorname || ''} ${m.nachname || ''}`.trim() || `Mitarbeiter ${i + 1}`;
          const sel = m.vertical ? summary(m.vertical, m.selectedModules) : null;
          const verticalLabel = m.vertical ? getVertical(m.vertical).label : '—';
          const mFiles = filesByMit[m.id] || [];
          return (
            <div key={m.id} className="qcg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-serif text-xl font-medium text-ink">{label}</div>
                  <div className="text-sm text-ink-mute mt-0.5">
                    {m.beschaeftigungAls || '—'} · geb. {m.geburtsdatum || '—'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {mFiles.map((f) => (
                    <a
                      key={f.id}
                      href={`/api/admin/download/${f.id}`}
                      className="qcg-btn"
                    >
                      {f.kind === 'erhebungsbogen' ? 'Erhebungsbogen ↓' : 'Angebot ↓'}
                    </a>
                  ))}
                  {mFiles.length === 0 && (
                    <span className="text-xs text-ink-mute">Keine Dateien</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-mint-100">
                <Stat label="Vertical" value={verticalLabel} />
                <Stat label="Module" value={sel ? `${sel.modules.length} (${sel.modules.map((mm) => mm.code).join(', ')})` : '—'} />
                <Stat label="Preis" value={sel ? fmtPreis(sel.preis) : '—'} />
              </div>

              {m.begruendung && (
                <div className="mt-4 pt-4 border-t border-mint-100">
                  <div className="qcg-label mb-1">Begründung</div>
                  <p className="text-sm text-ink-soft whitespace-pre-wrap leading-[1.6]">{m.begruendung}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="text-ink-mute w-44 shrink-0">{label}</dt>
      <dd className={`text-ink ${mono ? 'font-mono text-xs' : ''} break-words`}>{value || '—'}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="qcg-label">{label}</div>
      <div className="text-ink mt-1">{value}</div>
    </div>
  );
}
