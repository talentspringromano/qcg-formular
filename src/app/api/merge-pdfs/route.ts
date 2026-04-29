import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const runtime = 'nodejs';
export const maxDuration = 60;

type MergeBody = {
  erhebungsbogenUrl?: string;
  angebotPdfUrl?: string;
  fileName?: string;
  /** 'angebot-first' (default) or 'erhebungsbogen-first' */
  order?: 'angebot-first' | 'erhebungsbogen-first';
};

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
  // Auth: shared secret in `x-merge-secret` header
  const expected = process.env.MERGE_SECRET;
  if (!expected) {
    console.error('[merge-pdfs] MERGE_SECRET not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const provided = req.headers.get('x-merge-secret');
  if (!provided || provided !== expected) return unauthorized();

  let body: MergeBody;
  try {
    body = (await req.json()) as MergeBody;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { erhebungsbogenUrl, angebotPdfUrl, fileName, order } = body;
  if (!erhebungsbogenUrl || !angebotPdfUrl) {
    return NextResponse.json(
      { error: 'erhebungsbogenUrl and angebotPdfUrl are required' },
      { status: 400 },
    );
  }

  let erhebungsbogenBytes: Uint8Array;
  let angebotBytes: Uint8Array;
  try {
    [erhebungsbogenBytes, angebotBytes] = await Promise.all([
      fetchBytes(erhebungsbogenUrl),
      fetchBytes(angebotPdfUrl),
    ]);
  } catch (err) {
    console.error('[merge-pdfs] download failed:', err);
    return NextResponse.json({ error: 'Source PDF download failed' }, { status: 502 });
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
      // default: angebot first (sales-friendly)
      angebotPages.forEach((p) => merged.addPage(p));
      erhebungsbogenPages.forEach((p) => merged.addPage(p));
    }
  } catch (err) {
    console.error('[merge-pdfs] merge failed:', err);
    return NextResponse.json({ error: 'PDF merge failed' }, { status: 500 });
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
