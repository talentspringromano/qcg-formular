import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { QCGDocument } from '@/lib/generatePdf';
import { FormData } from '@/types/form';
import React from 'react';

export async function POST(request: NextRequest) {
  try {
    const data: FormData = await request.json();
    const buffer = await renderToBuffer(<QCGDocument data={data} />);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="QCG-Erhebungsbogen_${data.nachname || 'Formular'}_${data.vorname || ''}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
