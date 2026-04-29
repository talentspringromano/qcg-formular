import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { ensureTables, getDb } from '@/lib/db';
import { uploadPdf } from '@/lib/storage';
import { buildTokenUrl, createFileToken } from '@/lib/fileTokens';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Two accepted body types:
 *
 * 1) JSON
 *    {
 *      erhebungsbogenUrl: string,
 *      angebotPdfUrl:     string,   // must be publicly fetchable from our server
 *      fileName?:         string,
 *      order?:            'angebot-first' | 'erhebungsbogen-first'
 *    }
 *
 * 2) multipart/form-data  (preferred for Zapier — Drive auth lives in Zapier)
 *    Fields:
 *      erhebungsbogenUrl  (text)
 *      angebotFile        (file) ← the Drive PDF, sent as bytes
 *      fileName           (text, optional)
 *      order              (text, optional)
 */

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

export async function POST(req: NextRequest) {
  const expected = process.env.MERGE_SECRET;
  if (!expected) {
    console.error('[merge-pdfs] MERGE_SECRET not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const provided = req.headers.get('x-merge-secret');
  if (!provided || provided !== expected) return unauthorized();

  const contentType = req.headers.get('content-type') || '';

  let erhebungsbogenUrl: string | null = null;
  let angebotPdfUrl: string | null = null;
  let angebotBytesFromForm: Uint8Array | null = null;
  let fileName: string | undefined;
  let order: 'angebot-first' | 'erhebungsbogen-first' | undefined;
  let submissionId: string | null = null;
  let mitarbeiterId: string | null = null;

  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch (err) {
      console.error('[merge-pdfs] formData parse failed:', err);
      return NextResponse.json({ error: 'Invalid form body' }, { status: 400 });
    }

    const allKeys: string[] = [];
    for (const [k] of form.entries()) allKeys.push(k);
    console.log('[merge-pdfs] multipart received keys:', allKeys);

    // Direct lookups
    const tryString = (k: string) => {
      const v = form.get(k);
      return typeof v === 'string' ? v : null;
    };
    erhebungsbogenUrl = tryString('erhebungsbogenUrl');
    angebotPdfUrl = tryString('angebotPdfUrl');
    fileName = tryString('fileName') || undefined;
    submissionId = tryString('submissionId');
    mitarbeiterId = tryString('mitarbeiterId');
    const o0 = tryString('order');
    if (o0 === 'angebot-first' || o0 === 'erhebungsbogen-first') order = o0;

    // Fallback: Zapier wraps all "Data" fields into a single multipart part
    // named 'data' when a separate File is also sent. The wrapper is either
    // JSON or URL-encoded query string ("a=1&b=2"). Try both.
    if (!erhebungsbogenUrl) {
      const dataField = tryString('data');
      if (dataField) {
        let parsed: { erhebungsbogenUrl?: string; angebotPdfUrl?: string; fileName?: string; order?: string } | null = null;
        try {
          parsed = JSON.parse(dataField);
        } catch {
          // not JSON — try URL-encoded
          try {
            const params = new URLSearchParams(dataField);
            parsed = {
              erhebungsbogenUrl: params.get('erhebungsbogenUrl') || undefined,
              angebotPdfUrl: params.get('angebotPdfUrl') || undefined,
              fileName: params.get('fileName') || undefined,
              order: params.get('order') || undefined,
            };
          } catch (err) {
            console.warn('[merge-pdfs] data field is neither JSON nor URL-encoded:', err);
          }
        }
        if (parsed) {
          const p = parsed as Record<string, string | undefined>;
          if (p.erhebungsbogenUrl) erhebungsbogenUrl = p.erhebungsbogenUrl;
          if (p.angebotPdfUrl && !angebotPdfUrl) angebotPdfUrl = p.angebotPdfUrl;
          if (p.fileName && !fileName) fileName = p.fileName;
          if (p.submissionId && !submissionId) submissionId = p.submissionId;
          if (p.mitarbeiterId && !mitarbeiterId) mitarbeiterId = p.mitarbeiterId;
          if ((p.order === 'angebot-first' || p.order === 'erhebungsbogen-first') && !order) order = p.order;
        }
      }
    }
    // Also try fallback for submissionId/mitarbeiterId from URL-encoded data
    if (!submissionId) {
      const dataField = tryString('data');
      if (dataField) {
        try { submissionId = new URLSearchParams(dataField).get('submissionId'); } catch { /* ignore */ }
      }
    }
    if (!mitarbeiterId) {
      const dataField = tryString('data');
      if (dataField) {
        try { mitarbeiterId = new URLSearchParams(dataField).get('mitarbeiterId'); } catch { /* ignore */ }
      }
    }

    // Find any binary file part — Zapier's "File" field uses different keys
    // depending on UI version (file, angebotFile, attachment, …).
    let angebotFileField: FormDataEntryValue | null = null;
    for (const [, value] of form.entries()) {
      if (value && typeof value !== 'string') {
        angebotFileField = value;
        break;
      }
    }
    if (angebotFileField && typeof angebotFileField !== 'string') {
      const ab = await angebotFileField.arrayBuffer();
      angebotBytesFromForm = new Uint8Array(ab);
    }
  } else {
    let body: { erhebungsbogenUrl?: string; angebotPdfUrl?: string; fileName?: string; order?: string; submissionId?: string; mitarbeiterId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    erhebungsbogenUrl = body.erhebungsbogenUrl || null;
    angebotPdfUrl = body.angebotPdfUrl || null;
    fileName = body.fileName;
    submissionId = body.submissionId || null;
    mitarbeiterId = body.mitarbeiterId || null;
    if (body.order === 'angebot-first' || body.order === 'erhebungsbogen-first') order = body.order;
  }

  if (!erhebungsbogenUrl) {
    return NextResponse.json(
      {
        error: 'erhebungsbogenUrl is required',
        debug: {
          contentType,
          gotErhebungsbogenUrl: erhebungsbogenUrl,
          gotAngebotPdfUrl: angebotPdfUrl,
          gotAngebotBytes: angebotBytesFromForm ? angebotBytesFromForm.byteLength : 0,
          gotFileName: fileName,
          hint: 'Server saw multipart/form keys but no erhebungsbogenUrl. See Vercel function logs for the full key list.',
        },
      },
      { status: 400 },
    );
  }
  if (!angebotPdfUrl && !angebotBytesFromForm) {
    return NextResponse.json(
      {
        error: 'angebotFile (multipart) or angebotPdfUrl (json) is required',
        debug: { contentType, gotErhebungsbogenUrl: erhebungsbogenUrl },
      },
      { status: 400 },
    );
  }

  let erhebungsbogenBytes: Uint8Array;
  let angebotBytes: Uint8Array;
  try {
    if (angebotBytesFromForm) {
      [erhebungsbogenBytes, angebotBytes] = await Promise.all([
        fetchBytes(erhebungsbogenUrl),
        Promise.resolve(angebotBytesFromForm),
      ]);
    } else {
      [erhebungsbogenBytes, angebotBytes] = await Promise.all([
        fetchBytes(erhebungsbogenUrl),
        fetchBytes(angebotPdfUrl as string),
      ]);
    }
  } catch (err) {
    console.error('[merge-pdfs] download failed:', err);
    return NextResponse.json({ error: 'Source PDF download failed', detail: String(err) }, { status: 502 });
  }

  let merged: PDFDocument;
  try {
    merged = await PDFDocument.create();
    const angebotDoc = await PDFDocument.load(angebotBytes);
    const erhebungsbogenDoc = await PDFDocument.load(erhebungsbogenBytes);

    const angebotPages = await merged.copyPages(angebotDoc, angebotDoc.getPageIndices());
    const erhebungsbogenPages = await merged.copyPages(
      erhebungsbogenDoc,
      erhebungsbogenDoc.getPageIndices(),
    );

    if (order === 'erhebungsbogen-first') {
      erhebungsbogenPages.forEach((p) => merged.addPage(p));
      angebotPages.forEach((p) => merged.addPage(p));
    } else {
      angebotPages.forEach((p) => merged.addPage(p));
      erhebungsbogenPages.forEach((p) => merged.addPage(p));
    }
  } catch (err) {
    console.error('[merge-pdfs] merge failed:', err);
    return NextResponse.json({ error: 'PDF merge failed', detail: String(err) }, { status: 500 });
  }

  const out = await merged.save();
  const safeFileName = (fileName || 'Antrag.pdf').replace(/[^a-zA-Z0-9._-]+/g, '_');

  // Upload merged PDF to Vercel Blob and create a one-use token URL.
  // Drive Upload in Zapier consumes a normal HTTPS URL much more reliably
  // than the ephemeral hydrate that a binary response produces.
  let mergedTokenUrl: string | null = null;
  try {
    if (!submissionId || !mitarbeiterId) {
      console.warn('[merge-pdfs] submissionId/mitarbeiterId missing — skipping persistent storage');
    } else {
      await ensureTables();
      const sql = getDb();
      const blobPath = `submissions/${submissionId}/${mitarbeiterId}/merged.pdf`;
      const blob = await uploadPdf(blobPath, Buffer.from(out));
      const fileRow = await sql`
        INSERT INTO submission_files
          (submission_id, mitarbeiter_id, mitarbeiter_label, kind, blob_path, blob_url, file_name, size_bytes)
        VALUES
          (${submissionId}, ${mitarbeiterId}, ${mitarbeiterId}, 'merged', ${blob.pathname}, ${blob.url}, ${safeFileName}, ${blob.size})
        RETURNING id::text AS id
      `;
      const fileId = fileRow[0].id as string;
      // Multi-use token (1h) — Drive Upload may fetch the URL more than once
      // (preview + actual upload). Token still stops being valid after 1h.
      const token = await createFileToken(fileId, 60 * 60, false);
      const proto = req.headers.get('x-forwarded-proto') || 'https';
      const host = req.headers.get('host') || 'localhost';
      mergedTokenUrl = buildTokenUrl(`${proto}://${host}`, token);
    }
  } catch (err) {
    console.error('[merge-pdfs] persist merged failed (non-fatal):', err);
  }

  return NextResponse.json({
    ok: true,
    fileName: safeFileName,
    sizeBytes: out.byteLength,
    mergedUrl: mergedTokenUrl,
  });
}
