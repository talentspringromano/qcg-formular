'use client';

import { useState } from 'react';
import { FormData, defaultFormData } from '@/types/form';

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 mt-8 first:mt-0">
      {children}
    </h2>
  );
}

function FieldGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className || ''}`}>
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type || 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
    />
  );
}

function RadioGroup({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer group">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${value === opt.value ? 'border-blue-600 bg-blue-600' : 'border-slate-400 group-hover:border-blue-400'}`}>
            {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <span className="text-sm text-slate-700">{opt.label}</span>
          <input type="radio" className="sr-only" checked={value === opt.value} onChange={() => onChange(opt.value)} />
        </label>
      ))}
    </div>
  );
}

function CheckboxField({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${checked ? 'border-blue-600 bg-blue-600' : 'border-slate-400 group-hover:border-blue-400'}`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm text-slate-700">{label}</span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={() => onChange(!checked)} />
    </label>
  );
}

export default function Home() {
  const [data, setData] = useState<FormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateAusbildung = (index: number, field: string, value: string) => {
    const newArr = [...data.ausbildungen];
    newArr[index] = { ...newArr[index], [field]: value };
    setData((prev) => ({ ...prev, ausbildungen: newArr }));
  };

  const updateWerdegang = (index: number, field: string, value: string) => {
    const newArr = [...data.werdegang];
    newArr[index] = { ...newArr[index], [field]: value };
    setData((prev) => ({ ...prev, werdegang: newArr }));
  };

  const generatePdf = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('PDF-Generierung fehlgeschlagen');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QCG-Erhebungsbogen_${data.nachname || 'Formular'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Fehler bei der PDF-Generierung. Bitte versuchen Sie es erneut.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Persönliche Daten', icon: '1' },
    { title: 'Bildung & Werdegang', icon: '2' },
    { title: 'Betrieb & Beschäftigung', icon: '3' },
    { title: 'Qualifizierung', icon: '4' },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="text-xs uppercase tracking-widest text-blue-200 mb-1">Agentur für Arbeit Berlin Mitte</div>
          <h1 className="text-2xl font-bold">Fragebogen Qualifizierungschancengesetz</h1>
          <p className="text-blue-100 text-sm mt-2 max-w-xl">
            Erhebungsbogen zur Prüfung eines möglichen Anspruchs auf Weiterbildungsförderung Beschäftigter (ab 01.01.2019)
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-6 -mt-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex justify-between">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  step === i
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === i ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {s.icon}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">

          {/* Step 1: Persönliche Daten */}
          {step === 0 && (
            <div>
              <SectionTitle>Persönliche Daten</SectionTitle>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Nachname">
                  <Input value={data.nachname} onChange={(v) => update('nachname', v)} placeholder="Nachname" />
                </FieldGroup>
                <FieldGroup label="Vorname">
                  <Input value={data.vorname} onChange={(v) => update('vorname', v)} placeholder="Vorname" />
                </FieldGroup>
                <FieldGroup label="Geburtsname">
                  <Input value={data.geburtsname} onChange={(v) => update('geburtsname', v)} placeholder="Geburtsname" />
                </FieldGroup>
                <FieldGroup label="Geschlecht">
                  <RadioGroup
                    options={[
                      { value: 'maennl', label: 'männlich' },
                      { value: 'weibl', label: 'weiblich' },
                      { value: 'div', label: 'divers' },
                    ]}
                    value={data.geschlecht}
                    onChange={(v) => update('geschlecht', v as FormData['geschlecht'])}
                  />
                </FieldGroup>
                <FieldGroup label="Geburtsdatum">
                  <Input type="date" value={data.geburtsdatum} onChange={(v) => update('geburtsdatum', v)} />
                </FieldGroup>
                <FieldGroup label="Geburtsort">
                  <Input value={data.geburtsort} onChange={(v) => update('geburtsort', v)} placeholder="Geburtsort" />
                </FieldGroup>
              </div>

              <FieldGroup label="Familienstand" className="mt-4">
                <RadioGroup
                  options={[
                    { value: 'allein_lebend', label: 'allein lebend' },
                    { value: 'allein_erziehend', label: 'allein erziehend' },
                    { value: 'haeusliche_gemeinschaft', label: 'häusliche Gemeinschaft' },
                    { value: 'verheiratet', label: 'verheiratet/verpartnert' },
                  ]}
                  value={data.familienstand}
                  onChange={(v) => update('familienstand', v as FormData['familienstand'])}
                />
              </FieldGroup>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <FieldGroup label="Staatsangehörigkeit">
                  <Input value={data.staatsangehoerigkeit} onChange={(v) => update('staatsangehoerigkeit', v)} placeholder="z.B. deutsch" />
                </FieldGroup>
                <FieldGroup label="Grenzgänger">
                  <RadioGroup
                    options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                    value={data.grenzgaenger}
                    onChange={(v) => update('grenzgaenger', v as FormData['grenzgaenger'])}
                  />
                </FieldGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <FieldGroup label="PLZ, Wohnort">
                  <Input value={data.plzWohnort} onChange={(v) => update('plzWohnort', v)} placeholder="12345 Berlin" />
                </FieldGroup>
                <FieldGroup label="Straße, Haus-Nr.">
                  <Input value={data.strHausNr} onChange={(v) => update('strHausNr', v)} placeholder="Musterstraße 1" />
                </FieldGroup>
                <FieldGroup label="Telefon">
                  <Input type="tel" value={data.telefon} onChange={(v) => update('telefon', v)} placeholder="030 123456" />
                </FieldGroup>
                <FieldGroup label="Handy">
                  <Input type="tel" value={data.handy} onChange={(v) => update('handy', v)} placeholder="0170 1234567" />
                </FieldGroup>
                <FieldGroup label="Renten-/Sozialversicherungs-Nr.">
                  <Input value={data.rentenSvNr} onChange={(v) => update('rentenSvNr', v)} />
                </FieldGroup>
                <FieldGroup label="Kunden-Nr. (falls bekannt)">
                  <Input value={data.kundenNr} onChange={(v) => update('kundenNr', v)} />
                </FieldGroup>
              </div>

              <FieldGroup label="Grad der Behinderung" className="mt-4">
                <RadioGroup
                  options={[
                    { value: 'schwerbehindert', label: 'schwerbehindert' },
                    { value: 'gleichgestellt', label: 'gleichgestellt' },
                  ]}
                  value={data.gradBehinderung}
                  onChange={(v) => update('gradBehinderung', v as FormData['gradBehinderung'])}
                />
              </FieldGroup>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Aufenthaltsrechtliche Informationen</h3>
                <p className="text-xs text-slate-500 mb-3">Zusätzliche Angaben bei ausländischen Arbeitnehmern</p>

                <FieldGroup label="Aufenthaltsstatus" className="mb-3">
                  <RadioGroup
                    options={[
                      { value: 'niederlassungserlaubnis', label: 'Niederlassungserlaubnis' },
                      { value: 'duldung', label: 'Duldung' },
                      { value: 'aufenthaltserlaubnis', label: 'Aufenthaltserlaubnis' },
                    ]}
                    value={data.aufenthaltsstatus}
                    onChange={(v) => update('aufenthaltsstatus', v as FormData['aufenthaltsstatus'])}
                  />
                </FieldGroup>

                <FieldGroup label="Arbeitsmarktzugang / Erwerbstätigkeit gestattet">
                  <div className="flex flex-wrap items-center gap-4">
                    <RadioGroup
                      options={[
                        { value: 'unbefristet', label: 'unbefristet' },
                        { value: 'befristet', label: 'befristet' },
                      ]}
                      value={data.arbeitsmarktzugang}
                      onChange={(v) => update('arbeitsmarktzugang', v as FormData['arbeitsmarktzugang'])}
                    />
                    {data.arbeitsmarktzugang === 'befristet' && (
                      <Input type="date" value={data.arbeitsmarktzugangBis} onChange={(v) => update('arbeitsmarktzugangBis', v)} />
                    )}
                  </div>
                </FieldGroup>
              </div>

              <FieldGroup label="Arbeitsverhältnis während Bildungsmaßnahme" className="mt-4">
                <p className="text-xs text-slate-500 mb-1">Ich stehe in einem Arbeitsverhältnis und habe für die Dauer der Bildungsmaßnahme weiterhin Anspruch auf Arbeitsentgelt</p>
                <RadioGroup
                  options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                  value={data.arbeitsverhaeltnis}
                  onChange={(v) => update('arbeitsverhaeltnis', v as FormData['arbeitsverhaeltnis'])}
                />
              </FieldGroup>
            </div>
          )}

          {/* Step 2: Bildung & Werdegang */}
          {step === 1 && (
            <div>
              <SectionTitle>Schulbildung (höchster Bildungsabschluss)</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {schulbildungOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                      data.schulbildung === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      data.schulbildung === opt.value ? 'border-blue-600 bg-blue-600' : 'border-slate-400'
                    }`}>
                      {data.schulbildung === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm">{opt.label}</span>
                    <input type="radio" className="sr-only" checked={data.schulbildung === opt.value} onChange={() => update('schulbildung', opt.value)} />
                  </label>
                ))}
              </div>

              <SectionTitle>Berufliche Aus- und Weiterbildung</SectionTitle>
              <div className="space-y-3">
                {data.ausbildungen.map((a, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <FieldGroup label="Von – Bis">
                      <Input value={a.vonBis} onChange={(v) => updateAusbildung(i, 'vonBis', v)} placeholder="01.2015 – 12.2018" />
                    </FieldGroup>
                    <FieldGroup label="Ausbildungsstätte">
                      <Input value={a.ausbildungsstaette} onChange={(v) => updateAusbildung(i, 'ausbildungsstaette', v)} />
                    </FieldGroup>
                    <FieldGroup label="Ausbildung als">
                      <Input value={a.ausbildungAls} onChange={(v) => updateAusbildung(i, 'ausbildungAls', v)} />
                    </FieldGroup>
                    <FieldGroup label="Abschluss">
                      <RadioGroup
                        options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                        value={a.abschluss}
                        onChange={(v) => updateAusbildung(i, 'abschluss', v)}
                      />
                    </FieldGroup>
                  </div>
                ))}
              </div>

              <SectionTitle>Beruflicher Werdegang (letzte 7 Jahre)</SectionTitle>
              <p className="text-xs text-slate-500 mb-3">Auch Zeiten ohne Erwerbstätigkeit angeben</p>
              <div className="space-y-3">
                {data.werdegang.map((w, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <FieldGroup label="Von – Bis">
                      <Input value={w.vonBis} onChange={(v) => updateWerdegang(i, 'vonBis', v)} placeholder="01.2020 – heute" />
                    </FieldGroup>
                    <FieldGroup label="Arbeitgeber (Firma, Ort, Branche)">
                      <Input value={w.arbeitgeber} onChange={(v) => updateWerdegang(i, 'arbeitgeber', v)} />
                    </FieldGroup>
                    <FieldGroup label="Tätigkeit als">
                      <Input value={w.taetigkeitAls} onChange={(v) => updateWerdegang(i, 'taetigkeitAls', v)} />
                    </FieldGroup>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Betrieb & Beschäftigung */}
          {step === 2 && (
            <div>
              <SectionTitle>Angaben zum Betrieb</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Firma">
                  <Input value={data.firma} onChange={(v) => update('firma', v)} />
                </FieldGroup>
                <FieldGroup label="Branche">
                  <Input value={data.branche} onChange={(v) => update('branche', v)} />
                </FieldGroup>
                <FieldGroup label="Anschrift" className="sm:col-span-2">
                  <Input value={data.firmaAnschrift} onChange={(v) => update('firmaAnschrift', v)} />
                </FieldGroup>
                <FieldGroup label="Ansprechpartner">
                  <Input value={data.ansprechpartner} onChange={(v) => update('ansprechpartner', v)} />
                </FieldGroup>
                <FieldGroup label="Telefon">
                  <Input type="tel" value={data.firmaTelefon} onChange={(v) => update('firmaTelefon', v)} />
                </FieldGroup>
                <FieldGroup label="Anzahl sozialvers. pflichtige Mitarbeiter (ohne Azubi)">
                  <Input type="number" value={data.anzahlMitarbeiter} onChange={(v) => update('anzahlMitarbeiter', v)} />
                </FieldGroup>
                <FieldGroup label="Betriebs-Nr.">
                  <Input value={data.betriebsNr} onChange={(v) => update('betriebsNr', v)} />
                </FieldGroup>
              </div>

              <SectionTitle>Angaben zum Beschäftigungsverhältnis</SectionTitle>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Befristete Beschäftigung">
                  <RadioGroup
                    options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                    value={data.befristet}
                    onChange={(v) => update('befristet', v as FormData['befristet'])}
                  />
                </FieldGroup>
                {data.befristet === 'ja' && (
                  <FieldGroup label="Befristet bis">
                    <Input type="date" value={data.befristetBis} onChange={(v) => update('befristetBis', v)} />
                  </FieldGroup>
                )}
                <FieldGroup label="Beschäftigung als">
                  <Input value={data.beschaeftigungAls} onChange={(v) => update('beschaeftigungAls', v)} />
                </FieldGroup>
                <FieldGroup label="Beschäftigung auf Helferebene">
                  <RadioGroup
                    options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                    value={data.helferebene}
                    onChange={(v) => update('helferebene', v as FormData['helferebene'])}
                  />
                </FieldGroup>
                <FieldGroup label="SV-pflichtige Beschäftigung">
                  <RadioGroup
                    options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                    value={data.svPflichtig}
                    onChange={(v) => update('svPflichtig', v as FormData['svPflichtig'])}
                  />
                </FieldGroup>
                <FieldGroup label="Anzahl SV-pflichtige Mitarbeiter (ohne Azubi)">
                  <Input type="number" value={data.anzahlSvMitarbeiter} onChange={(v) => update('anzahlSvMitarbeiter', v)} />
                </FieldGroup>
              </div>

              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                <strong>Hinweis zur Betriebsgröße:</strong> Nicht berücksichtigt werden Auszubildende, Praktikanten und geringfügig Beschäftigte. Teilzeitbeschäftigte: bis 10h/Woche = 0,25, bis 20h = 0,5, bis 30h = 0,75.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <FieldGroup label="Bezug von Kurzarbeitergeld">
                  <RadioGroup
                    options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                    value={data.kurzarbeitergeld}
                    onChange={(v) => update('kurzarbeitergeld', v as FormData['kurzarbeitergeld'])}
                  />
                </FieldGroup>
                {data.kurzarbeitergeld === 'ja' && (
                  <FieldGroup label="Kurzarbeitergeld ab">
                    <Input type="date" value={data.kurzarbeitergeldAb} onChange={(v) => update('kurzarbeitergeldAb', v)} />
                  </FieldGroup>
                )}
                <FieldGroup label="Bezug von Transfer-Kurzarbeitergeld">
                  <RadioGroup
                    options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                    value={data.transferKurzarbeitergeld}
                    onChange={(v) => update('transferKurzarbeitergeld', v as FormData['transferKurzarbeitergeld'])}
                  />
                </FieldGroup>
                {data.transferKurzarbeitergeld === 'ja' && (
                  <FieldGroup label="Transfer-Kurzarbeitergeld ab">
                    <Input type="date" value={data.transferKurzarbeitergeldAb} onChange={(v) => update('transferKurzarbeitergeldAb', v)} />
                  </FieldGroup>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Qualifizierung */}
          {step === 3 && (
            <div>
              <SectionTitle>Qualifizierungsvorschlag</SectionTitle>

              <FieldGroup label="Notwendige Qualifizierungsinhalte/-bedarfe" className="mb-4">
                <textarea
                  value={data.qualifizierungsInhalte}
                  onChange={(e) => update('qualifizierungsInhalte', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y"
                />
              </FieldGroup>

              <FieldGroup label="Geplante Weiterbildungsdauer/-zeitraum" className="mb-4">
                <Input value={data.weiterbildungsDauer} onChange={(v) => update('weiterbildungsDauer', v)} placeholder="z.B. 6 Monate, 01.06.2025 – 30.11.2025" />
              </FieldGroup>

              <div className="space-y-3 mb-4">
                <CheckboxField
                  checked={data.weiterbildungImBetrieb}
                  onChange={(v) => update('weiterbildungImBetrieb', v)}
                  label="Weiterbildung im Betrieb durch Arbeitgeber"
                />
                <CheckboxField
                  checked={data.weiterbildungDurchTraeger}
                  onChange={(v) => update('weiterbildungDurchTraeger', v)}
                  label="Weiterbildung durch Bildungsträger"
                />
              </div>

              {data.weiterbildungDurchTraeger && (
                <div className="ml-6 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 mb-4">
                  <FieldGroup label="Geplanter Bildungsträger">
                    <Input value={data.bildungstraeger} onChange={(v) => update('bildungstraeger', v)} />
                  </FieldGroup>
                  <FieldGroup label="Anschrift">
                    <Input value={data.traegerAnschrift} onChange={(v) => update('traegerAnschrift', v)} />
                  </FieldGroup>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="Maßnahme Nr.">
                      <Input value={data.massnahmeNr} onChange={(v) => update('massnahmeNr', v)} />
                    </FieldGroup>
                    <FieldGroup label="Maßnahme Ort">
                      <Input value={data.massnahmeOrt} onChange={(v) => update('massnahmeOrt', v)} />
                    </FieldGroup>
                  </div>
                </div>
              )}

              <FieldGroup label="Begründung der Fördernotwendigkeit für den Arbeitnehmer" className="mb-6">
                <textarea
                  value={data.begruendung}
                  onChange={(e) => update('begruendung', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y"
                />
              </FieldGroup>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <strong>Hinweise zum Datenschutz:</strong> Mit dem Absenden bestätigen Sie die Richtigkeit der Angaben und die Kenntnisnahme der Hinweise zum Datenschutz unter arbeitsagentur.de/datenerhebung. Sie erklären sich mit der Verarbeitung Ihrer persönlichen Daten zum Zwecke der Abklärung bestehender Fördermöglichkeiten durch die Bundesagentur für Arbeit einverstanden.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Zurück
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={generatePdf}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-all shadow-sm flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    PDF wird erstellt...
                  </>
                ) : (
                  'PDF herunterladen'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
