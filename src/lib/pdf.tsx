import { renderToBuffer } from '@react-pdf/renderer';
import { QCGDocument } from './generatePdf';
import type { BetriebData, MitarbeiterData, FormData } from '@/types/form';

export function mergeForPdf(betrieb: BetriebData, mitarbeiter: MitarbeiterData): FormData {
  // FormData omits 'id' and 'behinderungVor' from MitarbeiterData; merge with Betrieb
  const { id: _id, behinderungVor: _bv, ...rest } = mitarbeiter;
  void _id;
  void _bv;
  return { ...betrieb, ...rest } as FormData;
}

export async function renderErhebungsbogen(data: FormData): Promise<Buffer> {
  const buffer = await renderToBuffer(<QCGDocument data={data} />);
  return Buffer.from(buffer);
}
