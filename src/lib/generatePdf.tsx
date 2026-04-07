import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { FormData } from '@/types/form';

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  header: {
    fontSize: 8,
    marginBottom: 4,
    color: '#333',
  },
  headerBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  introBox: {
    border: '1pt solid #000',
    padding: 8,
    marginBottom: 12,
    fontSize: 8.5,
  },
  introBoldItalic: {
    fontFamily: 'Helvetica-BoldOblique',
    fontSize: 8.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 8,
    marginBottom: 6,
  },
  box: {
    border: '1pt solid #000',
    padding: 8,
    marginBottom: 8,
  },
  boxTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    width: '30%',
  },
  value: {
    fontSize: 9,
    width: '20%',
    borderBottom: '0.5pt solid #999',
    minHeight: 12,
    paddingBottom: 1,
  },
  labelNarrow: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    width: '18%',
  },
  valueWide: {
    fontSize: 9,
    flex: 1,
    borderBottom: '0.5pt solid #999',
    minHeight: 12,
    paddingBottom: 1,
  },
  checkbox: {
    width: 10,
    height: 10,
    border: '1pt solid #000',
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    border: '1pt solid #000',
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  checkmark: {
    fontSize: 7,
    color: '#fff',
  },
  checkboxLabel: {
    fontSize: 8,
    marginRight: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #000',
    paddingBottom: 2,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 18,
    borderBottom: '0.5pt solid #ddd',
    alignItems: 'center',
  },
  signatureLine: {
    borderBottom: '1pt solid #000',
    marginTop: 20,
    marginBottom: 4,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
  },
  smallText: {
    fontSize: 7,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
  },
  datenschutz: {
    marginTop: 8,
    fontSize: 7,
  },
  datenschutzTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 2,
  },
});

function Checkbox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
      <View style={checked ? styles.checkboxChecked : styles.checkbox}>
        {checked && <Text style={styles.checkmark}>X</Text>}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </View>
  );
}

function HeaderBlock() {
  return (
    <View style={{ marginBottom: 2 }}>
      <Text style={styles.header}>
        <Text style={styles.headerBold}>Agentur für Berlin Mitte - Gemeinsamer Arbeitgeber-Service – Team XXX –</Text>
      </Text>
      <Text style={styles.header}>
        <Text style={styles.headerBold}>Postanschrift: Agentur für Arbeit Berlin Mitte, 10956 Berlin</Text>
      </Text>
    </View>
  );
}

function FieldRow({ label, value, label2, value2 }: { label: string; value: string; label2?: string; value2?: string }) {
  if (label2 !== undefined) {
    return (
      <View style={styles.row}>
        <Text style={[styles.label, { width: '22%' }]}>{label}</Text>
        <Text style={[styles.value, { width: '28%' }]}>{value}</Text>
        <Text style={[styles.label, { width: '18%' }]}>{label2}</Text>
        <Text style={[styles.value, { width: '32%' }]}>{value2 || ''}</Text>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <Text style={styles.labelNarrow}>{label}</Text>
      <Text style={styles.valueWide}>{value}</Text>
    </View>
  );
}

export function QCGDocument({ data }: { data: FormData }) {
  const schulbildungOptions = [
    { value: 'kein_abschluss', label: 'kein Abschluss' },
    { value: 'foerderschule', label: 'Abschluss Förderschule' },
    { value: 'hauptschule', label: 'Hauptschulabschluss' },
    { value: 'erweit_hauptschule', label: 'erweit. Hauptschulabschluss' },
    { value: 'mittlere_reife', label: 'mittlere Reife' },
    { value: 'klasse10_13', label: 'Klasse 10–13 ohne Abschluss' },
    { value: 'fachhochschulreife', label: 'Fachhochschulreife' },
    { value: 'fachabitur', label: 'Fachabitur' },
    { value: 'abitur', label: 'Abitur' },
    { value: 'hochschule_ohne', label: 'Hochschule ohne Abschluss' },
    { value: 'fachhochschule', label: 'Fachhochschule' },
    { value: 'hochschule', label: 'Hochschule/Universität' },
  ];

  return (
    <Document>
      {/* PAGE 1 - Personendaten */}
      <Page size="A4" style={styles.page}>
        <HeaderBlock />

        <Text style={styles.title}>Fragebogen Qualifizierungschancengesetz</Text>

        <View style={styles.introBox}>
          <Text>
            Mit diesem Fragebogen kann die Agentur für Arbeit / Jobcenter individuell und im Einzelfall einen möglichen Anspruch auf Leistungen aus dem Qualifizierungschancengesetz – Weiterbildungsförderung Beschäftigter ab 01.01.2019 prüfen.{' '}
            <Text style={styles.introBoldItalic}>Wichtig: dieser Fragebogen ist noch keine Förderzusage!</Text>
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Personendaten von beschäftigten Arbeitnehmern</Text>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Persönliche Daten</Text>

          <FieldRow label="Nachname:" value={data.nachname} label2="Vorname:" value2={data.vorname} />

          <View style={styles.row}>
            <Text style={[styles.label, { width: '22%' }]}>Geburtsname:</Text>
            <Text style={[styles.value, { width: '28%' }]}>{data.geburtsname}</Text>
            <Text style={[styles.label, { width: '14%' }]}>Geschlecht:</Text>
            <View style={{ flexDirection: 'row', width: '36%', alignItems: 'center' }}>
              <Checkbox checked={data.geschlecht === 'maennl'} label="männl." />
              <Checkbox checked={data.geschlecht === 'weibl'} label="weibl." />
              <Checkbox checked={data.geschlecht === 'div'} label="div." />
            </View>
          </View>

          <FieldRow label="Geburtsdatum:" value={data.geburtsdatum} label2="Geburtsort:" value2={data.geburtsort} />

          <View style={styles.row}>
            <Text style={[styles.label, { width: '18%' }]}>Familienstand:</Text>
            <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Checkbox checked={data.familienstand === 'allein_lebend'} label="allein lebend" />
              <Checkbox checked={data.familienstand === 'allein_erziehend'} label="allein erziehend" />
              <Checkbox checked={data.familienstand === 'haeusliche_gemeinschaft'} label="häusliche Gemeinschaft" />
              <Checkbox checked={data.familienstand === 'verheiratet'} label="verheiratet/verpartnert" />
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { width: '22%' }]}>Staatsangehörigkeit:</Text>
            <Text style={[styles.value, { width: '28%' }]}>{data.staatsangehoerigkeit}</Text>
            <Text style={[styles.label, { width: '16%' }]}>Grenzgänger:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Checkbox checked={data.grenzgaenger === 'ja'} label="ja" />
              <Checkbox checked={data.grenzgaenger === 'nein'} label="nein" />
            </View>
          </View>

          <FieldRow label="PLZ, Wohnort:" value={data.plzWohnort} label2="Str., Haus-Nr.:" value2={data.strHausNr} />
          <FieldRow label="Telefon:" value={data.telefon} label2="Handy:" value2={data.handy} />
          <FieldRow label="Renten-/Sozialversicherungs-Nr.:" value={data.rentenSvNr} label2="Kunden-Nr. (falls bekannt):" value2={data.kundenNr} />

          <View style={styles.row}>
            <Text style={[styles.label, { width: '26%' }]}>Grad der Behinderung:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Checkbox checked={data.gradBehinderung === 'schwerbehindert'} label="schwerbehindert" />
              <Checkbox checked={data.gradBehinderung === 'gleichgestellt'} label="gleichgestellt" />
            </View>
          </View>

          <View style={{ marginTop: 6 }}>
            <Text style={[styles.boldText, { fontSize: 8.5, marginBottom: 3 }]}>
              Aufenthaltsrechtliche Informationen: <Text style={{ fontFamily: 'Helvetica', fontSize: 8 }}>zusätzliche Angaben bei ausländischen Arbeitnehmern:</Text>
            </Text>
            <View style={styles.checkboxRow}>
              <Text style={[styles.boldText, { fontSize: 8.5, marginRight: 4 }]}>Aufenthaltsstatus:</Text>
              <Checkbox checked={data.aufenthaltsstatus === 'niederlassungserlaubnis'} label="Niederlassungserlaubnis" />
              <Checkbox checked={data.aufenthaltsstatus === 'duldung'} label="Duldung" />
              <Checkbox checked={data.aufenthaltsstatus === 'aufenthaltserlaubnis'} label="Aufenthaltserlaubnis" />
            </View>
            <View style={styles.checkboxRow}>
              <Text style={[styles.boldText, { fontSize: 8.5, marginRight: 4 }]}>Arbeitsmarktzugang/ Erwerbstätigkeit gestattet:</Text>
              <Checkbox checked={data.arbeitsmarktzugang === 'unbefristet'} label="unbefristet" />
              <Checkbox checked={data.arbeitsmarktzugang === 'befristet'} label={`befristet bis: ${data.arbeitsmarktzugangBis || '_______________'}`} />
            </View>
          </View>

          <View style={{ marginTop: 4, fontSize: 8 }}>
            <Text>
              Ich stehe in einem Arbeitsverhältnis und habe für die Dauer der Bildungsmaßnahme weiterhin Anspruch auf Arbeitsentgelt (entfällt für Bezieher von Transferkurzarbeitergeld)
            </Text>
            <View style={[styles.checkboxRow, { marginTop: 2 }]}>
              <Checkbox checked={data.arbeitsverhaeltnis === 'ja'} label="ja" />
              <Checkbox checked={data.arbeitsverhaeltnis === 'nein'} label="nein" />
            </View>
          </View>
        </View>

        {/* Schulbildung */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Schulbildung (höchster Bildungsabschluss)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {schulbildungOptions.map((opt) => (
              <View key={opt.value} style={{ flexDirection: 'row', alignItems: 'center', width: '25%', marginBottom: 3 }}>
                <Checkbox checked={data.schulbildung === opt.value} label={opt.label} />
              </View>
            ))}
          </View>
        </View>

        {/* Berufliche Aus- und Weiterbildung */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Berufliche Aus- und Weiterbildung</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.boldText, { width: '25%', fontSize: 8 }]}>von … bis … (Tag.Monat.Jahr)</Text>
            <Text style={[styles.boldText, { width: '25%', fontSize: 8 }]}>Ausbildungsstätte</Text>
            <Text style={[styles.boldText, { width: '25%', fontSize: 8 }]}>Ausbildung als</Text>
            <Text style={[styles.boldText, { width: '25%', fontSize: 8 }]}>Abschluss</Text>
          </View>
          {data.ausbildungen.map((a, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: '25%', fontSize: 8 }}>{a.vonBis}</Text>
              <Text style={{ width: '25%', fontSize: 8 }}>{a.ausbildungsstaette}</Text>
              <Text style={{ width: '25%', fontSize: 8 }}>{a.ausbildungAls}</Text>
              <View style={{ width: '25%', flexDirection: 'row', alignItems: 'center' }}>
                <Checkbox checked={a.abschluss === 'ja'} label="ja" />
                <Checkbox checked={a.abschluss === 'nein'} label="nein" />
              </View>
            </View>
          ))}
        </View>

        {/* Beruflicher Werdegang */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Beruflicher Werdegang (der letzten 7 Jahre, auch Zeiten ohne Erwerbstätigkeit)</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.boldText, { width: '30%', fontSize: 8 }]}>von … bis … (Tag.Monat.Jahr)</Text>
            <Text style={[styles.boldText, { width: '40%', fontSize: 8 }]}>Arbeitgeber (Firma, Ort, Branche)</Text>
            <Text style={[styles.boldText, { width: '30%', fontSize: 8 }]}>Tätigkeit als</Text>
          </View>
          {data.werdegang.map((w, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: '30%', fontSize: 8 }}>{w.vonBis}</Text>
              <Text style={{ width: '40%', fontSize: 8 }}>{w.arbeitgeber}</Text>
              <Text style={{ width: '30%', fontSize: 8 }}>{w.taetigkeitAls}</Text>
            </View>
          ))}
        </View>

        {/* Datenschutz */}
        <View style={styles.datenschutz}>
          <Text style={styles.datenschutzTitle}>Hinweise zum Datenschutz</Text>
          <Text style={{ fontSize: 7 }}>
            Mit Ihrer Unterschrift bestätigen Sie die Richtigkeit der Angaben und die Kenntnisnahme der Hinweise zum Datenschutz unter https://www.arbeitsagentur.de/datenerhebung. Insbesondere erklären Sie mit Ihrer Unterschrift, dass Sie mit der Verarbeitung Ihrer persönlichen Daten zum Zwecke der Abklärung bestehender Fördermöglichkeiten durch die Bundesagentur für Arbeit einverstanden sind.
          </Text>
        </View>
        <View style={styles.signatureLine} />
        <View style={styles.signatureRow}>
          <Text>Datum</Text>
          <Text>Unterschrift Arbeitnehmer</Text>
        </View>
      </Page>

      {/* PAGE 2 - Betrieb & Qualifizierung */}
      <Page size="A4" style={styles.page}>
        <HeaderBlock />

        {/* Angaben zum Betrieb */}
        <View style={[styles.box, { marginTop: 16 }]}>
          <Text style={styles.boxTitle}>Angaben zum Betrieb</Text>
          <FieldRow label="Firma:" value={data.firma} label2="Branche:" value2={data.branche} />
          <FieldRow label="Anschrift:" value={data.firmaAnschrift} />
          <FieldRow label="Ansprechpartner:" value={data.ansprechpartner} label2="Telefon:" value2={data.firmaTelefon} />
          <FieldRow label="Anzahl sozialvers. pflichtige Mitarbeiter (ohne Azubi):" value={data.anzahlMitarbeiter} label2="Betriebs-Nr.:" value2={data.betriebsNr} />
        </View>

        {/* Angaben zum Beschäftigungsverhältnis */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Angaben zum Beschäftigungsverhältnis</Text>

          <View style={styles.row}>
            <Text style={[styles.label, { width: '28%' }]}>Befristete Beschäftigung:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '20%' }}>
              <Checkbox checked={data.befristet === 'ja'} label="ja" />
              <Checkbox checked={data.befristet === 'nein'} label="nein" />
            </View>
            <Text style={[styles.label, { width: '22%' }]}>Wenn ja, befristet bis:</Text>
            <Text style={[styles.value, { width: '30%' }]}>{data.befristetBis}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { width: '22%' }]}>Beschäftigung als:</Text>
            <Text style={[styles.value, { width: '28%' }]}>{data.beschaeftigungAls}</Text>
            <Text style={[styles.label, { width: '28%' }]}>Beschäftigung auf Helferebene:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Checkbox checked={data.helferebene === 'ja'} label="ja" />
              <Checkbox checked={data.helferebene === 'nein'} label="nein" />
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { width: '30%' }]}>SV-pflichtige Beschäftigung:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Checkbox checked={data.svPflichtig === 'ja'} label="ja" />
              <Checkbox checked={data.svPflichtig === 'nein'} label="nein" />
            </View>
          </View>

          <View style={styles.row}>
            <Text style={{ fontSize: 8 }}>
              <Text style={styles.boldText}>Anzahl</Text> sozialversicherungspflichtige Mitarbeiter (ohne Azubi): {data.anzahlSvMitarbeiter || '……….'}
            </Text>
          </View>

          <View style={{ marginTop: 4, padding: 4, backgroundColor: '#f5f5f5', fontSize: 6.5 }}>
            <Text>
              <Text style={styles.boldText}>Beachten Sie bitte</Text> folgende Hinweise zur Festlegung der Betriebsgröße: Nicht berücksichtigt bei der Beschäftigtenzahl werden Auszubildende, Praktikanten und geringfügig Beschäftigte (z.B. Minijobber). Bei der Festlegung der Zahl der Beschäftigten sind Teilzeitbeschäftigte mit einer regelmäßigen wöchentlichen Arbeitszeit von nicht mehr als zehn Stunden mit 0,25, von nicht mehr als 20 Stunden mit 0,5 und von nicht mehr als 30 Stunden mit 0,75 zu berücksichtigen. Bei der Beurteilung der Betriebsgröße wird jeweils das Gesamtunternehmen betrachtet, alle Betriebsstätten, Partnerunternehmen bzw. verbundene Unternehmen sind zu berücksichtigen.
            </Text>
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={[styles.label, { width: '32%' }]}>Bezug von Kurzarbeitergeld:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '25%' }}>
              <Checkbox checked={data.kurzarbeitergeld === 'ja'} label="ja" />
              <Checkbox checked={data.kurzarbeitergeld === 'nein'} label="nein" />
            </View>
            <Text style={[styles.label, { width: '6%' }]}>ab:</Text>
            <Text style={[styles.value, { width: '37%' }]}>{data.kurzarbeitergeldAb}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { width: '32%' }]}>Bezug von Transfer-Kurzarbeitergeld:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '25%' }}>
              <Checkbox checked={data.transferKurzarbeitergeld === 'ja'} label="ja" />
              <Checkbox checked={data.transferKurzarbeitergeld === 'nein'} label="nein" />
            </View>
            <Text style={[styles.label, { width: '6%' }]}>ab:</Text>
            <Text style={[styles.value, { width: '37%' }]}>{data.transferKurzarbeitergeldAb}</Text>
          </View>
        </View>

        {/* Qualifizierungsvorschlag */}
        <Text style={[styles.title, { fontSize: 13, textAlign: 'left', marginTop: 10 }]}>Qualifizierungsvorschlag</Text>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Geplante Weiterbildung</Text>

          <View style={styles.row}>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Oblique' }}>Notwendige Qualifizierungsinhalte/-bedarfe:</Text>
          </View>
          <Text style={[styles.valueWide, { marginBottom: 4, minHeight: 24 }]}>{data.qualifizierungsInhalte}</Text>

          <View style={styles.row}>
            <Text style={[styles.boldText, { fontSize: 8.5 }]}>Geplante Weiterbildungsdauer/-zeitraum:</Text>
            <Text style={[styles.valueWide, { marginLeft: 4 }]}>{data.weiterbildungsDauer}</Text>
          </View>

          <View style={[styles.checkboxRow, { marginTop: 4 }]}>
            <Checkbox checked={data.weiterbildungImBetrieb} label="Weiterbildung im Betrieb durch Arbeitgeber" />
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox checked={data.weiterbildungDurchTraeger} label="Weiterbildung durch Bildungsträger, Geplanter Bildungsträger (soweit bereits bekannt):" />
          </View>

          {data.weiterbildungDurchTraeger && (
            <View style={{ paddingLeft: 20 }}>
              <FieldRow label="Anschrift:" value={data.traegerAnschrift} />
              <View style={styles.row}>
                <Text style={[styles.label, { width: '18%' }]}>Maßnahme Nr.:</Text>
                <Text style={[styles.value, { width: '32%' }]}>{data.massnahmeNr}</Text>
                <Text style={[styles.label, { width: '18%' }]}>Maßnahme Ort:</Text>
                <Text style={[styles.value, { width: '32%' }]}>{data.massnahmeOrt}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Begründung der Fördernotwendigkeit für den Arbeitnehmer</Text>
          <Text style={[styles.valueWide, { minHeight: 30 }]}>{data.begruendung}</Text>
        </View>

        {/* Datenschutz */}
        <View style={styles.datenschutz}>
          <Text style={styles.datenschutzTitle}>Hinweise zum Datenschutz</Text>
          <Text style={{ fontSize: 7 }}>
            Mit Ihrer Unterschrift bestätigen Sie die Richtigkeit der Angaben und die Kenntnisnahme der Hinweise zum Datenschutz unter https://www.arbeitsagentur.de/datenerhebung. Insbesondere erklären Sie mit Ihrer Unterschrift, dass Sie mit der Verarbeitung Ihrer persönlichen Daten zum Zwecke der Abklärung bestehender Fördermöglichkeiten durch die Bundesagentur für Arbeit einverstanden sind.
          </Text>
        </View>
        <View style={styles.signatureLine} />
        <View style={[styles.signatureRow, { justifyContent: 'space-between' }]}>
          <Text>Datum</Text>
          <Text>Stempel des Arbeitgebers</Text>
          <Text>Unterschrift des Arbeitgebers</Text>
        </View>
      </Page>
    </Document>
  );
}
