import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

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

  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch (err) {
      console.error('[merge-pdfs] formData parse failed:', err);
      return NextResponse.json({ error: 'Invalid form body' }, { status: 400 });
    }
    const erh = form.get('erhebungsbogenUrl');
    if (typeof erh === 'string') erhebungsbogenUrl = erh;

    const angebotPdfUrlField = form.get('angebotPdfUrl');
    if (typeof angebotPdfUrlField === 'string' && angebotPdfUrlField) angebotPdfUrl = angebotPdfUrlField;

    const angebotFileField = form.get('angebotFile');
    if (angebotFileField && typeof angebotFileField !== 'string') {
      // Blob/File
      const ab = await angebotFileField.arrayBuffer();
      angebotBytesFromForm = new Uint8Array(ab);
    }

    const fn = form.get('fileName');
    if (typeof fn === 'string') fileName = fn;
    const o = form.get('order');
    if (o === 'angebot-first' || o === 'erhebungsbogen-first') order = o;
  } else {
    let body: { erhebungsbogenUrl?: string; angebotPdfUrl?: string; fileName?: string; order?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    erhebungsbogenUrl = body.erhebungsbogenUrl || null;
    angebotPdfUrl = body.angebotPdfUrl || null;
    fileName = body.fileName;
    if (body.order === 'angebot-first' || body.order === 'erhebungsbogen-first') order = body.order;
  }

  if (!erhebungsbogenUrl) {
    return NextResponse.json({ error: 'erhebungsbogenUrl is required' }, { status: 400 });
  }
  if (!angebotPdfUrl && !angebotBytesFromForm) {
    return NextResponse.json(
      { error: 'angebotFile (multipart) or angebotPdfUrl (json) is required' },
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

  return new NextResponse(Buffer.from(out), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFileName}"`,
      'Content-Length': String(out.byteLength),
      'Cache-Control': 'private, no-store',
    },
  });
}
