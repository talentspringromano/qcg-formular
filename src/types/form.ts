export interface FormData {
  // Persönliche Daten
  nachname: string;
  vorname: string;
  geburtsname: string;
  geschlecht: 'maennl' | 'weibl' | 'div' | '';
  geburtsdatum: string;
  geburtsort: string;
  familienstand: 'allein_lebend' | 'allein_erziehend' | 'haeusliche_gemeinschaft' | 'verheiratet' | '';
  staatsangehoerigkeit: string;
  grenzgaenger: 'ja' | 'nein' | '';
  plzWohnort: string;
  strHausNr: string;
  telefon: string;
  handy: string;
  rentenSvNr: string;
  kundenNr: string;
  gradBehinderung: 'schwerbehindert' | 'gleichgestellt' | '';
  aufenthaltsstatus: 'niederlassungserlaubnis' | 'duldung' | 'aufenthaltserlaubnis' | '';
  arbeitsmarktzugang: 'unbefristet' | 'befristet' | '';
  arbeitsmarktzugangBis: string;
  arbeitsverhaeltnis: 'ja' | 'nein' | '';

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

  // Angaben zum Betrieb
  firma: string;
  branche: string;
  firmaAnschrift: string;
  ansprechpartner: string;
  firmaTelefon: string;
  anzahlMitarbeiter: string;
  betriebsNr: string;

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

  // Qualifizierungsvorschlag
  qualifizierungsInhalte: string;
  weiterbildungsDauer: string;
  weiterbildungImBetrieb: boolean;
  weiterbildungDurchTraeger: boolean;
  bildungstraeger: string;
  traegerAnschrift: string;
  massnahmeNr: string;
  massnahmeOrt: string;
  begruendung: string;
}

export const defaultFormData: FormData = {
  nachname: '',
  vorname: '',
  geburtsname: '',
  geschlecht: '',
  geburtsdatum: '',
  geburtsort: '',
  familienstand: '',
  staatsangehoerigkeit: '',
  grenzgaenger: '',
  plzWohnort: '',
  strHausNr: '',
  telefon: '',
  handy: '',
  rentenSvNr: '',
  kundenNr: '',
  gradBehinderung: '',
  aufenthaltsstatus: '',
  arbeitsmarktzugang: '',
  arbeitsmarktzugangBis: '',
  arbeitsverhaeltnis: '',
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
  firma: '',
  branche: '',
  firmaAnschrift: '',
  ansprechpartner: '',
  firmaTelefon: '',
  anzahlMitarbeiter: '',
  betriebsNr: '',
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
  qualifizierungsInhalte: '',
  weiterbildungsDauer: '',
  weiterbildungImBetrieb: false,
  weiterbildungDurchTraeger: false,
  bildungstraeger: '',
  traegerAnschrift: '',
  massnahmeNr: '',
  massnahmeOrt: '',
  begruendung: '',
};
