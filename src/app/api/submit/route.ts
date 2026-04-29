import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureTables, getDb } from '@/lib/db';
import { uploadPdf } from '@/lib/storage';
import { mergeForPdf, renderErhebungsbogen } from '@/lib/pdf';
import { createFileToken, buildTokenUrl } from '@/lib/fileTokens';
import { getModule, summary, type Vertical } from '@/lib/modules';
import { anrede, fmtDate } from '@/lib/offerContent';
import type { AppData, MitarbeiterData } from '@/types/form';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MitarbeiterSchema = z.object({ id: z.string().min(1) }).passthrough();

const AppDataSchema = z.object({
  betrieb: z.object({}).passthrough(),
  mitarbeiter: z.array(MitarbeiterSchema).min(1).max(20),
});

function mitarbeiterLabel(m: MitarbeiterData, index: number): string {
  const name = `${m.vorname || ''} ${m.nachname || ''}`.trim();
  return name || `Mitarbeiter ${index + 1}`;
}

function safeName(s: string): string {
  return (s || '').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 40) || 'unbenannt';
}

function templateKeyFor(m: MitarbeiterData): string | null {
  if (m.vertical !== 'sales' && m.vertical !== 'marketing' && m.vertical !== 'ki') return null;
  const z = m.zeitmodell === 'tz' ? 'tz' : 'vz';
  return `${m.vertical}-${z}`;
}

function verticalLabel(v: Vertical): string {
  if (v === 'sales') return 'Sales Academy';
  if (v === 'marketing') return 'Marketing Academy';
  return 'KI Academy';
}

function fmtPreis(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

const rateMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (rateMap.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  rateMap.set(ip, arr);
  return arr.length > RATE_LIMIT;
}

const ZAPIER_TIMEOUT_MS = 5000;

async function fireZapier(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.ZAPIER_WEBHOOK_URL;
  if (!url) {
    console.warn('[submit] ZAPIER_WEBHOOK_URL not set — skipping notify');
    return;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ZAPIER_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) console.warn('[submit] zapier webhook returned', res.status);
  } catch (err) {
    console.warn('[submit] zapier webhook failed (non-fatal):', err);
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = req.headers.get('user-agent') || '';

  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: 'Zu viele Anfragen' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Ungültiger Body' }, { status: 400 });
  }

  const parsed = AppDataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validierung fehlgeschlagen', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const appData = parsed.data as unknown as AppData;
  const { betrieb, mitarbeiter } = appData;

  await ensureTables();
  const sql = getDb();

  const inserted = await sql`
    INSERT INTO submissions (betrieb, app_data, contact_email, contact_name, ip, user_agent)
    VALUES (
      ${JSON.stringify(betrieb)}::jsonb,
      ${JSON.stringify(appData)}::jsonb,
      ${(betrieb as { kontaktEmail?: string }).kontaktEmail || null},
      ${betrieb.ansprechpartner || null},
      ${ip},
      ${userAgent}
    )
    RETURNING id, created_at
  `;
  const submissionId = inserted[0].id as string;
  const createdAt = new Date(inserted[0].created_at).toISOString();

  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'localhost';
  const origin = `${proto}://${host}`;
  const adminUrl = `${origin}/admin/${submissionId}`;

  const angebotsdatum = fmtDate();

  // Per-Mitarbeiter: render Erhebungsbogen, upload, insert file row, mint token, fire Zapier webhook
  let firstCustomerTokenUrl: string | null = null;

  for (let i = 0; i < mitarbeiter.length; i++) {
    const m = mitarbeiter[i];
    const label = mitarbeiterLabel(m, i);
    const fileName = `QCG-Erhebungsbogen_${safeName(m.nachname || label)}.pdf`;
    const blobPath = `submissions/${submissionId}/${m.id}/erhebungsbogen.pdf`;

    let buffer: Buffer;
    try {
      buffer = await renderErhebungsbogen(mergeForPdf(betrieb, m));
    } catch (err) {
      console.error('[submit] PDF render failed for', m.id, err);
      await sql`DELETE FROM submissions WHERE id = ${submissionId}`;
      return NextResponse.json(
        { ok: false, error: 'PDF-Generierung fehlgeschlagen' },
        { status: 500 },
      );
    }

    let blob;
    try {
      blob = await uploadPdf(blobPath, buffer);
    } catch (err) {
      console.error('[submit] blob upload failed for', m.id, err);
      await sql`DELETE FROM submissions WHERE id = ${submissionId}`;
      return NextResponse.json(
        { ok: false, error: 'Speicher-Upload fehlgeschlagen' },
        { status: 500 },
      );
    }

    const fileRow = await sql`
      INSERT INTO submission_files
        (submission_id, mitarbeiter_id, mitarbeiter_label, kind, blob_path, blob_url, file_name, size_bytes)
      VALUES
        (${submissionId}, ${m.id}, ${label}, 'erhebungsbogen', ${blob.pathname}, ${blob.url}, ${fileName}, ${blob.size})
      RETURNING id::text AS id
    `;
    const fileId = fileRow[0].id as string;

    // Token for Zapier (1-use, 1h TTL).
    const zapierToken = await createFileToken(fileId, 60 * 60);
    const erhebungsbogenUrlForZapier = buildTokenUrl(origin, zapierToken);

    // Token for the customer's "download my own form" link on the success page.
    if (i === 0) {
      const customerToken = await createFileToken(fileId, 30 * 60);
      firstCustomerTokenUrl = buildTokenUrl(origin, customerToken);
    }

    // Build per-Mitarbeiter Zapier payload (the customer's full data + a fetchable URL for the Erhebungsbogen)
    const v = m.vertical ? (m.vertical as Vertical) : null;
    const sel = v ? summary(v, m.selectedModules || []) : null;
    const wochenGesamt = v && sel ? (m.zeitmodell === 'tz' ? sel.tzWochen : sel.vzWochen) : 0;
    const moduleNames = v
      ? (m.selectedModules || [])
          .map((id) => {
            const mod = getModule(id);
            return mod ? `${mod.code}: ${mod.name}` : null;
          })
          .filter((n): n is string => !!n)
      : [];
    const moduleCodes = v
      ? (m.selectedModules || [])
          .map((id) => getModule(id)?.code)
          .filter((c): c is string => !!c)
      : [];

    const payload: Record<string, unknown> = {
      // Identifiers
      submissionId,
      mitarbeiterId: m.id,
      createdAt,
      adminUrl,

      // Template selection
      templateKey: templateKeyFor(m),
      vertical: v,
      verticalLabel: v ? verticalLabel(v) : null,
      zeitmodell: m.zeitmodell || null,
      zeitmodellLabel: m.zeitmodell === 'vz' ? 'Vollzeit' : m.zeitmodell === 'tz' ? 'Teilzeit' : null,

      // Personal placeholders for the Google Doc template
      vorname: m.vorname || '',
      nachname: m.nachname || '',
      anrede: anrede(m.geschlecht),
      angebotsdatum,
      geschlecht: m.geschlecht || null,
      beschaeftigungAls: m.beschaeftigungAls || '',

      // Customer firma context
      firma: betrieb.firma || '',
      branche: betrieb.branche || '',
      firmaAnschrift: betrieb.firmaAnschrift || '',
      ansprechpartner: betrieb.ansprechpartner || '',
      firmaTelefon: betrieb.firmaTelefon || '',

      // Module selection
      selectedModuleIds: m.selectedModules || [],
      selectedModuleCodes: moduleCodes.join(', '),
      selectedModuleNames: moduleNames.join(', '),
      moduleCount: sel?.modules.length || 0,
      ueGesamt: sel?.ue || 0,
      wochenGesamt,
      preisGesamt: sel?.preis || 0,
      preisGesamtFormatted: sel ? fmtPreis(sel.preis) : '0,00 €',

      // Erhebungsbogen — token-protected backend-proxied URL.
      // 1-use, valid 1h. Zapier (PDF.co) downloads it ONCE for the merge.
      erhebungsbogenUrl: erhebungsbogenUrlForZapier,
      erhebungsbogenFileName: fileName,
    };

    // Fire-and-await per Mitarbeiter (so Zapier sees them in order; serial is fine for typical sizes)
    await fireZapier(payload);
  }

  return NextResponse.json({
    ok: true,
    submissionId,
    customerDownload: firstCustomerTokenUrl ? { url: firstCustomerTokenUrl } : null,
  });
}
