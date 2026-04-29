export interface BetriebData {
  firma: string;
  branche: string;
  firmaAnschrift: string;
  ansprechpartner: string;
  firmaTelefon: string;
  anzahlMitarbeiter: string;
  betriebsNr: string;
}

export interface MitarbeiterData {
  id: string;

  // Persönliche Daten
  nachname: string;
  vorname: string;
  geburtsname: string;
  geschlecht: 'maennl' | 'weibl' | 'div' | '';
  geburtsdatum: string;
  geburtsort: string;
  familienstand: 'allein_lebend' | 'allein_erziehend' | 'haeusliche_gemeinschaft' | 'verheiratet' | '';
  staatsangehoerigkeit: string[];
  grenzgaenger: 'ja' | 'nein' | '';
  plzWohnort: string;
  strHausNr: string;
  telefon: string;
  handy: string;
  rentenSvNr: string;
  kundenNr: string;
  behinderungVor: 'ja' | 'nein' | '';
  gradBehinderung: 'schwerbehindert' | 'gleichgestellt' | '';
  aufenthaltsstatus: 'niederlassungserlaubnis' | 'duldung' | 'aufenthaltserlaubnis' | '';
  arbeitsmarktzugang: 'unbefristet' | 'befristet' | '';
  arbeitsmarktzugangBis: string;
  arbeitsverhaeltnis: 'ja' | 'nein' | '';

  // Beschäftigungsverhältnis
  befristet: 'ja' | 'nein' | '';
  befristetBis: string;
  beschaeftigungAls: string;
  helferebene: 'ja' | 'nein' | '';
  svPflichtig: 'ja' | 'nein' | '';
  anzahlSvMitarbeiter: string;
  kurzarbeitergeld: 'ja' | 'nein' | '';
  kurzarbeitergeldAb: string;
  transferKurzarbeitergeld: 'ja' | 'nein' | '';
  transferKurzarbeitergeldAb: string;

  // Bildung-Schnellerfassung (optional)
  cvFileName: string;
  cvDataUrl: string;

  // Schulbildung
  schulbildung: string;

  // Berufliche Aus- und Weiterbildung
  ausbildungen: {
    vonBis: string;
    ausbildungsstaette: string;
    ausbildungAls: string;
    abschluss: 'ja' | 'nein' | '';
  }[];

  // Beruflicher Werdegang
  werdegang: {
    vonBis: string;
    arbeitgeber: string;
    taetigkeitAls: string;
  }[];

  // Qualifizierungsvorschlag
  vertical: '' | 'marketing' | 'sales' | 'ki';
  selectedModules: string[];
  zeitmodell: '' | 'tz' | 'vz';
  qualifizierungsInhalte: string;
  weiterbildungsDauer: string;
  weiterbildungImBetrieb: boolean;
  weiterbildungDurchTraeger: boolean;
  bildungstraeger: string;
  traegerAnschrift: string;
  massnahmeNr: string;
  massnahmeOrt: string;
  notwendigkeit: string[];
  notwendigkeitFreitext: string;
  bezug: string[];
  bezugFreitext: string;
  begruendung: string;
}

export interface AppData {
  betrieb: BetriebData;
  mitarbeiter: MitarbeiterData[];
}

export type FormData = BetriebData & Omit<MitarbeiterData, 'id' | 'behinderungVor'>;

export const defaultBetriebData: BetriebData = {
  firma: '',
  branche: '',
  firmaAnschrift: '',
  ansprechpartner: '',
  firmaTelefon: '',
  anzahlMitarbeiter: '',
  betriebsNr: '',
};

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'm_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function defaultMitarbeiterData(): MitarbeiterData {
  return {
    id: newId(),
    nachname: '',
    vorname: '',
    geburtsname: '',
    geschlecht: '',
    geburtsdatum: '',
    geburtsort: '',
    familienstand: '',
    staatsangehoerigkeit: [],
    grenzgaenger: '',
    plzWohnort: '',
    strHausNr: '',
    telefon: '',
    handy: '',
    rentenSvNr: '',
    kundenNr: '',
    behinderungVor: '',
    gradBehinderung: '',
    aufenthaltsstatus: '',
    arbeitsmarktzugang: '',
    arbeitsmarktzugangBis: '',
    arbeitsverhaeltnis: '',
    befristet: '',
    befristetBis: '',
    beschaeftigungAls: '',
    helferebene: '',
    svPflichtig: '',
    anzahlSvMitarbeiter: '',
    kurzarbeitergeld: '',
    kurzarbeitergeldAb: '',
    transferKurzarbeitergeld: '',
    transferKurzarbeitergeldAb: '',
    cvFileName: '',
    cvDataUrl: '',
    schulbildung: '',
    ausbildungen: [
      { vonBis: '', ausbildungsstaette: '', ausbildungAls: '', abschluss: '' },
      { vonBis: '', ausbildungsstaette: '', ausbildungAls: '', abschluss: '' },
      { vonBis: '', ausbildungsstaette: '', ausbildungAls: '', abschluss: '' },
    ],
    werdegang: [
      { vonBis: '', arbeitgeber: '', taetigkeitAls: '' },
      { vonBis: '', arbeitgeber: '', taetigkeitAls: '' },
      { vonBis: '', arbeitgeber: '', taetigkeitAls: '' },
      { vonBis: '', arbeitgeber: '', taetigkeitAls: '' },
      { vonBis: '', arbeitgeber: '', taetigkeitAls: '' },
    ],
    vertical: '',
    selectedModules: [],
    zeitmodell: '',
    qualifizierungsInhalte: '',
    weiterbildungsDauer: '',
    weiterbildungImBetrieb: false,
    weiterbildungDurchTraeger: true,
    bildungstraeger: 'Talentspring Academy Group GmbH',
    traegerAnschrift: 'Kurfürstendamm 207-208, 10719 Berlin',
    massnahmeNr: 'wird nachgereicht',
    massnahmeOrt: 'Remote',
    notwendigkeit: [],
    notwendigkeitFreitext: '',
    bezug: [],
    bezugFreitext: '',
    begruendung: '',
  };
}

export function defaultAppData(): AppData {
  return {
    betrieb: { ...defaultBetriebData },
    mitarbeiter: [defaultMitarbeiterData()],
  };
}

export function isMitarbeiterEmpty(m: MitarbeiterData): boolean {
  return (
    !m.nachname && !m.vorname && !m.geburtsname && !m.geschlecht && !m.geburtsdatum &&
    !m.geburtsort && !m.familienstand && m.staatsangehoerigkeit.length === 0 &&
    !m.grenzgaenger && !m.plzWohnort && !m.strHausNr && !m.telefon && !m.handy &&
    !m.rentenSvNr && !m.kundenNr && !m.behinderungVor && !m.gradBehinderung &&
    !m.aufenthaltsstatus && !m.arbeitsmarktzugang && !m.arbeitsverhaeltnis &&
    !m.befristet && !m.beschaeftigungAls && !m.helferebene && !m.svPflichtig &&
    !m.anzahlSvMitarbeiter && !m.kurzarbeitergeld && !m.transferKurzarbeitergeld &&
    !m.cvFileName && !m.schulbildung && !m.vertical && m.selectedModules.length === 0 &&
    m.notwendigkeit.length === 0 && m.bezug.length === 0 &&
    !m.qualifizierungsInhalte && !m.weiterbildungsDauer &&
    !m.weiterbildungImBetrieb && !m.begruendung &&
    m.ausbildungen.every((a) => !a.vonBis && !a.ausbildungsstaette && !a.ausbildungAls && !a.abschluss) &&
    m.werdegang.every((w) => !w.vonBis && !w.arbeitgeber && !w.taetigkeitAls)
  );
}
