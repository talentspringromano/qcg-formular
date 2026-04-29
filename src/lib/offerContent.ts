// Helpers used by the submit route to populate the Zapier webhook payload.
// (Vertical-specific module/curriculum data lives in Google Docs templates now —
// rendering happens via Zapier, no longer server-side.)

export function anrede(geschlecht: 'maennl' | 'weibl' | 'div' | ''): string {
  if (geschlecht === 'maennl') return 'Sehr geehrter Herr';
  if (geschlecht === 'weibl') return 'Sehr geehrte Frau';
  return 'Guten Tag';
}

export function fmtDate(d: Date = new Date()): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
