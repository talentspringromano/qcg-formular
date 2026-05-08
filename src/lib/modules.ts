export type Vertical = 'marketing' | 'sales' | 'ki';

export interface Module {
  id: string;
  code: string;
  name: string;
  ue: number;
  tzWochen: number;
  vzWochen: number;
  preis: number;
  pflicht?: boolean;
}

export interface VerticalDef {
  key: Vertical;
  label: string;
  modules: Module[];
  validCombos: string[][];
}

export const VERTICALS: VerticalDef[] = [
  {
    key: 'marketing',
    label: 'Marketing Academy',
    modules: [
      { id: 'MKT1', code: 'MKT 1', name: 'Paid & Conversion', ue: 375, tzWochen: 15, vzWochen: 8, preis: 6952.5 },
      { id: 'MKT2', code: 'MKT 2', name: 'E-Commerce & Content', ue: 375, tzWochen: 7, vzWochen: 7, preis: 6952.5 },
      { id: 'MKT3', code: 'MKT 3', name: 'Analytics, PM & Automation', ue: 350, tzWochen: 14, vzWochen: 7, preis: 6489.0 },
    ],
    validCombos: [
      ['MKT1', 'MKT2', 'MKT3'],
      ['MKT1', 'MKT2'],
      ['MKT2', 'MKT3'],
      ['MKT1'],
      ['MKT2'],
      ['MKT3'],
    ],
  },
  {
    key: 'sales',
    label: 'Sales Academy',
    modules: [
      { id: 'SLS1', code: 'SLS 1', name: 'SDR & Outbound Sales', ue: 350, tzWochen: 14, vzWochen: 7, preis: 6489.0 },
      { id: 'SLS2', code: 'SLS 2', name: 'AE & Solution Selling', ue: 350, tzWochen: 14, vzWochen: 7, preis: 6489.0 },
    ],
    validCombos: [
      ['SLS1', 'SLS2'],
      ['SLS1'],
      ['SLS2'],
    ],
  },
  {
    key: 'ki',
    label: 'KI Academy',
    modules: [
      { id: 'KI1', code: 'KI 1', name: 'KI Grundlagen', ue: 350, tzWochen: 14, vzWochen: 7, preis: 6489.0, pflicht: true },
      { id: 'KI2a', code: 'KI 2a', name: 'KI-Marketing – Content & Prompting', ue: 250, tzWochen: 10, vzWochen: 5, preis: 4635.0 },
      { id: 'KI2b', code: 'KI 2b', name: 'KI-Marketing – Automation & Praxis', ue: 275, tzWochen: 11, vzWochen: 5.5, preis: 5098.5 },
      { id: 'KI3a', code: 'KI 3a', name: 'KI-Vertrieb – Prospecting & Discovery', ue: 250, tzWochen: 10, vzWochen: 5, preis: 4635.0 },
      { id: 'KI3b', code: 'KI 3b', name: 'KI-Vertrieb – Automation & Praxis', ue: 275, tzWochen: 11, vzWochen: 5.5, preis: 5098.5 },
    ],
    validCombos: [
      ['KI1'],
      ['KI1', 'KI2a'],
      ['KI1', 'KI2a', 'KI2b'],
      ['KI1', 'KI3a'],
      ['KI1', 'KI3a', 'KI3b'],
    ],
  },
];

export function getVertical(key: Vertical): VerticalDef {
  return VERTICALS.find((v) => v.key === key)!;
}

export function getModule(id: string): Module | undefined {
  for (const v of VERTICALS) {
    const m = v.modules.find((mm) => mm.id === id);
    if (m) return m;
  }
  return undefined;
}

export function isValidCombo(vertical: Vertical, ids: string[]): boolean {
  const def = getVertical(vertical);
  const sorted = [...ids].sort().join(',');
  return def.validCombos.some((c) => [...c].sort().join(',') === sorted);
}

export function summary(vertical: Vertical, ids: string[]) {
  const def = getVertical(vertical);
  const mods = ids.map((id) => def.modules.find((m) => m.id === id)).filter((m): m is Module => !!m);
  return {
    modules: mods,
    ue: mods.reduce((s, m) => s + m.ue, 0),
    tzWochen: mods.reduce((s, m) => s + m.tzWochen, 0),
    vzWochen: mods.reduce((s, m) => s + m.vzWochen, 0),
    preis: mods.reduce((s, m) => s + m.preis, 0),
  };
}

export const NOTWENDIGKEIT_OPTIONS = [
  { id: 'veraltete_skills', label: 'Veraltete Skills', desc: 'Aktuelle Fähigkeiten reichen nicht mehr für die Aufgaben' },
  { id: 'unternehmen', label: 'Unternehmensanforderungen', desc: 'Neue Anforderungen vom Arbeitgeber an die Position' },
  { id: 'digitalisierung', label: 'Digitalisierung', desc: 'Aufgaben werden zunehmend digital/KI-gestützt' },
  { id: 'jobgefaehrdung', label: 'Jobgefährdung', desc: 'Arbeitsplatz akut bedroht ohne Weiterbildung' },
] as const;

export const BEZUG_OPTIONS = [
  { id: 'vorkenntnisse', label: 'Vorkenntnisse', desc: 'Bringt bereits Grundkenntnisse aus Werdegang/Ausbildung mit' },
  { id: 'verwandte_taetigkeit', label: 'Verwandte Tätigkeiten', desc: 'Aktuelle/frühere Tätigkeiten sind thematisch verwandt' },
  { id: 'interesse', label: 'Interesse', desc: 'Persönliches Interesse / Eigenmotivation' },
] as const;
