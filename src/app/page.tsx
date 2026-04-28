'use client';

import { useState, useRef, useEffect } from 'react';
import {
  AppData,
  BetriebData,
  MitarbeiterData,
  defaultAppData,
  defaultMitarbeiterData,
  isMitarbeiterEmpty,
} from '@/types/form';
import {
  VERTICALS,
  getVertical,
  getModule,
  isValidCombo,
  summary,
  NOTWENDIGKEIT_OPTIONS,
  BEZUG_OPTIONS,
  type Vertical,
} from '@/lib/modules';

const staatsangehoerigkeitOptions = [
  'afghanisch', 'ägyptisch', 'albanisch', 'algerisch', 'andorranisch', 'angolanisch',
  'antiguanisch', 'äquatorialguineisch', 'argentinisch', 'armenisch', 'aserbaidschanisch',
  'äthiopisch', 'australisch', 'bahamaisch', 'bahrainisch', 'bangladeschisch', 'barbadisch',
  'belarussisch', 'belgisch', 'belizisch', 'beninisch', 'bhutanisch', 'bolivianisch',
  'bosnisch-herzegowinisch', 'botsuanisch', 'brasilianisch', 'britisch', 'bruneiisch',
  'bulgarisch', 'burkinisch', 'burundisch', 'chilenisch', 'chinesisch', 'costa-ricanisch',
  'dänisch', 'deutsch', 'dominicanisch', 'dominikanisch', 'dschibutisch', 'ecuadorianisch',
  'emiratisch', 'eritreisch', 'estnisch', 'eswatinisch', 'fidschianisch', 'finnisch',
  'französisch', 'gabunisch', 'gambisch', 'georgisch', 'ghanaisch', 'grenadisch', 'Griechen',
  'griechisch', 'guatemaltekisch', 'guinea-bissauisch', 'guineisch', 'guyanisch',
  'haitianisch', 'honduranisch', 'indisch', 'indonesisch', 'irakisch', 'iranisch', 'irisch',
  'isländisch', 'israelisch', 'italienisch', 'ivorisch', 'jamaikanisch', 'japanisch',
  'jemenitisch', 'jordanisch', 'kambodschanisch', 'kamerunisch', 'kanadisch', 'kapverdisch',
  'kasachisch', 'katarisch', 'kenianisch', 'kirgisisch', 'kiribatisch',
  'kittitisch und nevisisch', 'kolumbianisch', 'komorisch', 'kongolesisch (Brazzaville)',
  'kongolesisch (Kinshasa)', 'kroatisch', 'kubanisch', 'kuwaitisch', 'laotisch', 'lesothisch',
  'lettisch', 'libanesisch', 'liberianisch', 'libysch', 'liechtensteinisch', 'litauisch',
  'lucianisch', 'luxemburgisch', 'madagassisch', 'malawisch', 'malaysisch', 'maledivisch',
  'malisch', 'maltesisch', 'marokkanisch', 'marshallisch', 'mauretanisch', 'mauritisch',
  'mexikanisch', 'mikronesisch', 'moldauisch', 'monegassisch', 'mongolisch', 'montenegrinisch',
  'mosambikanisch', 'myanmarisch', 'namibisch', 'nauruisch', 'nepalesisch', 'neuseeländisch',
  'nicaraguanisch', 'niederländisch', 'nigerianisch', 'nigrisch', 'nordkoreanisch',
  'nordmazedonisch', 'norwegisch', 'omanisch', 'österreichisch', 'osttimorisch', 'pakistanisch',
  'palauisch', 'panamaisch', 'papua-neuguineisch', 'paraguayisch', 'peruanisch', 'philippinisch',
  'polnisch', 'portugiesisch', 'ruandisch', 'rumänisch', 'russländisch', 'salomonisch',
  'salvadorianisch', 'sambisch', 'samoanisch', 'san-marinesisch', 'são-toméisch',
  'saudi-arabisch', 'schwedisch', 'schweizerisch', 'senegalesisch', 'serbisch', 'seychellisch',
  'sierra-leonisch', 'simbabwisch', 'singapurisch', 'slowakisch', 'slowenisch', 'somalisch',
  'spanisch', 'sri-lankisch', 'südafrikanisch', 'sudanesisch', 'südkoreanisch',
  'südsudanesisch', 'surinamisch', 'Swasi', 'syrisch', 'tadschikisch', 'tansanisch',
  'thailändisch', 'togoisch', 'tongaisch', 'trinidadisch und tobagoisch', 'tschadisch',
  'tschechisch', 'tunesisch', 'türkisch', 'turkmenisch', 'tuvaluisch', 'ugandisch',
  'ukrainisch', 'ungarisch', 'uruguayisch', 'US-amerikanisch', 'usbekisch', 'vanuatuisch',
  'venezolanisch', 'vietnamesisch', 'vincentisch', 'zentralafrikanisch', 'zyprisch',
];

function StaatsangehoerigkeitSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = staatsangehoerigkeitOptions.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (s: string) => {
    if (value.includes(s)) onChange(value.filter((v) => v !== s));
    else onChange([...value, s]);
  };

  const remove = (s: string) => onChange(value.filter((v) => v !== s));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="qcg-input min-h-[2.75rem] flex items-center justify-between gap-2 text-left"
      >
        <div className="flex flex-wrap gap-1.5 flex-1">
          {value.length === 0 ? (
            <span className="text-ink-mute text-[15px]">Staatsangehörigkeit auswählen</span>
          ) : (
            value.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-mint-100 text-green-900 rounded-full text-xs font-medium border border-mint-300"
              >
                {v}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(v);
                  }}
                  className="text-green-800 hover:text-green-900 cursor-pointer leading-none"
                  aria-label={`${v} entfernen`}
                >
                  ×
                </span>
              </span>
            ))
          )}
        </div>
        <svg
          className={`w-4 h-4 text-ink-mute shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-mint-200 rounded-[14px] shadow-[var(--shadow-md)] overflow-hidden">
          <div className="p-2 border-b border-mint-100">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen..."
              className="qcg-input text-sm py-2"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-ink-mute">Keine Treffer</div>
            ) : (
              filtered.map((s) => {
                const checked = value.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(s)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-mint-50 transition-colors ${
                      checked ? 'bg-mint-100 text-green-900 font-medium' : 'text-ink'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      checked ? 'border-green-800 bg-green-800' : 'border-mint-300'
                    }`}>
                      {checked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {s}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const branchenOptions = [
  'Agrarwirtschaft',
  'Baugewerbe',
  'Chemie- und Rohstoffindustrie',
  'Dienstleistungen und Handwerk',
  'E-Commerce',
  'Energie und Umwelt',
  'Finanzen, Versicherungen und Immobilien',
  'Freizeit',
  'Gesellschaft',
  'Handel',
  'Internet',
  'Konsumgüter',
  'Medien',
  'Metall und Elektronik',
  'Pharmaindustrie und Gesundheit',
  'Sport und Fitness',
  'Telekommunikation und IT',
  'Tourismus und Gastronomie',
  'Verkehr und Logistik',
  'Werbung und Marketing',
  'Wirtschaft und Politik',
];

function BrancheSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = branchenOptions.filter((b) =>
    b.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="qcg-input flex items-center justify-between text-left"
      >
        <span className={value ? 'text-ink' : 'text-ink-mute'}>
          {value || 'Branche auswählen'}
        </span>
        <svg
          className={`w-4 h-4 text-ink-mute transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-mint-200 rounded-[14px] shadow-[var(--shadow-md)] overflow-hidden">
          <div className="p-2 border-b border-mint-100">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen..."
              className="qcg-input text-sm py-2"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-ink-mute">Keine Treffer</div>
            ) : (
              filtered.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    onChange(b);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-mint-50 transition-colors ${
                    value === b ? 'bg-mint-100 text-green-900 font-medium' : 'text-ink'
                  }`}
                >
                  {b}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
    <h2 className="font-serif text-[22px] font-medium text-ink leading-tight mb-4 mt-8 first:mt-0">
      {children}
    </h2>
  );
}

function FieldGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
      <label className="qcg-label">{label}</label>
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
      className="qcg-input"
    />
  );
}

function RadioGroup({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3.5 pt-1.5">
      {options.map((opt) => (
        <label key={opt.value} className="qcg-radio">
          <input type="radio" className="sr-only" checked={value === opt.value} onChange={() => onChange(opt.value)} />
          <span className="qcg-radio-bullet" />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxField({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input type="checkbox" className="sr-only" checked={checked} onChange={() => onChange(!checked)} />
      <span
        className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-colors ${
          checked ? 'border-green-800 bg-green-800' : 'border-mint-300 bg-white group-hover:border-green-700'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}

type CvParseStatus = 'idle' | 'parsing' | 'ok' | 'error';

function CvUpload({
  fileName,
  status,
  errorMsg,
  onFile,
  onClear,
}: {
  fileName: string;
  status: CvParseStatus;
  errorMsg?: string;
  onFile: (name: string, dataUrl: string) => void;
  onClear: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Datei zu groß (max. 8 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onFile(file.name, String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  if (fileName) {
    const tone =
      status === 'error'
        ? { box: 'bg-red-50 border-red-200', text: 'text-red-900', icon: 'text-red-600', sub: 'text-red-700' }
        : status === 'ok'
          ? { box: 'bg-mint-100 border-green-700', text: 'text-green-900', icon: 'text-green-800', sub: 'text-green-800' }
          : { box: 'bg-mint-50 border-mint-300', text: 'text-green-900', icon: 'text-green-700', sub: 'text-ink-soft' };

    return (
      <div className={`flex flex-col gap-1.5 px-4 py-3 rounded-[14px] border ${tone.box}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {status === 'parsing' ? (
              <svg className={`animate-spin w-5 h-5 shrink-0 ${tone.icon}`} viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : status === 'ok' ? (
              <svg className={`w-5 h-5 shrink-0 ${tone.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : status === 'error' ? (
              <svg className={`w-5 h-5 shrink-0 ${tone.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0L3.19 16a2 2 0 001.74 3z" />
              </svg>
            ) : (
              <svg className={`w-5 h-5 shrink-0 ${tone.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            <span className={`text-sm truncate ${tone.text}`}>{fileName}</span>
          </div>
          <button
            type="button"
            onClick={onClear}
            className={`text-xs font-medium shrink-0 hover:underline ${tone.sub}`}
          >
            entfernen
          </button>
        </div>
        {status === 'parsing' && (
          <p className={`text-xs ${tone.sub}`}>Lebenslauf wird ausgewertet…</p>
        )}
        {status === 'ok' && (
          <p className={`text-xs ${tone.sub}`}>Felder unten wurden vorausgefüllt — bitte prüfen.</p>
        )}
        {status === 'error' && (
          <p className={`text-xs ${tone.sub}`}>{errorMsg || 'Auswertung fehlgeschlagen — bitte manuell ausfüllen.'}</p>
        )}
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragActive) setDragActive(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={`flex flex-col items-center justify-center gap-2 px-6 py-10 border-2 border-dashed rounded-[14px] cursor-pointer transition-colors ${
        dragActive
          ? 'border-green-700 bg-mint-100'
          : 'border-mint-300 bg-mint-50/50 hover:border-green-700 hover:bg-mint-50'
      }`}
    >
      <svg
        className={`w-8 h-8 transition-colors ${dragActive ? 'text-green-800' : 'text-green-700'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <div className="text-center">
        <span className={`text-sm font-medium ${dragActive ? 'text-green-900' : 'text-ink'}`}>
          {dragActive ? 'Datei hier ablegen' : 'Datei hierher ziehen oder klicken'}
        </span>
        <p className="text-xs text-ink-mute mt-1">PDF, DOC, DOCX – max. 8 MB</p>
      </div>
      <input
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </label>
  );
}

function Section({
  index,
  total,
  title,
  isOpen,
  isComplete,
  summary,
  onToggle,
  onContinue,
  isLast,
  children,
}: {
  index: number;
  total: number;
  title: string;
  isOpen: boolean;
  isComplete: boolean;
  summary?: string;
  onToggle: () => void;
  onContinue?: () => void;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`qcg-card ${isOpen ? 'qcg-card-open' : isComplete ? 'qcg-card-done' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3.5 px-5 py-4 text-left bg-transparent border-0 cursor-pointer"
      >
        <span
          className={`flex items-center justify-center w-[34px] h-[34px] rounded-full text-[13px] font-semibold shrink-0 transition-colors ${
            isComplete
              ? 'bg-green-700 text-white'
              : isOpen
                ? 'bg-green-800 text-white'
                : 'bg-mint-200 text-green-800'
          }`}
        >
          {isComplete ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            index
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[11px] uppercase tracking-[0.08em] text-ink-mute mb-0.5">Schritt {index} von {total}</span>
          <span className="block font-serif text-[19px] font-medium leading-[1.2] text-ink">{title}</span>
          {!isOpen && summary && (
            <span className="block text-[13px] text-ink-mute truncate mt-1">{summary}</span>
          )}
        </span>
        <svg
          className={`w-5 h-5 text-ink-mute transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-4 border-t border-mint-100">
          {children}
          {onContinue && !isLast && (
            <div className="flex justify-end mt-6">
              <button type="button" onClick={onContinue} className="qcg-btn">
                Weiter →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function mitarbeiterLabel(m: MitarbeiterData, index: number): string {
  const name = `${m.vorname} ${m.nachname}`.trim();
  return name || `Mitarbeiter ${index + 1}`;
}

type ParsedCv = {
  schulbildung?: string;
  ausbildungen?: { vonBis: string; ausbildungsstaette: string; ausbildungAls: string; abschluss: 'ja' | 'nein' | '' }[];
  werdegang?: { vonBis: string; arbeitgeber: string; taetigkeitAls: string }[];
};

export default function Home() {
  const [app, setApp] = useState<AppData>(() => defaultAppData());
  const [activeId, setActiveId] = useState<string>(() => app.mitarbeiter[0].id);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [cvParseStatus, setCvParseStatus] = useState<Record<string, { status: CvParseStatus; error?: string }>>({});
  const [activeSection, setActiveSection] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const openSection = (tab: number, idx: number) =>
    setActiveSection((s) => ({ ...s, [tab]: s[tab] === idx ? -1 : idx }));
  const goToSection = (tab: number, idx: number) =>
    setActiveSection((s) => ({ ...s, [tab]: idx }));

  const activeIndex = Math.max(0, app.mitarbeiter.findIndex((m) => m.id === activeId));
  const data = app.mitarbeiter[activeIndex] ?? app.mitarbeiter[0];
  const betrieb = app.betrieb;

  const updateBetrieb = <K extends keyof BetriebData>(key: K, value: BetriebData[K]) => {
    setApp((prev) => ({ ...prev, betrieb: { ...prev.betrieb, [key]: value } }));
  };

  const update = <K extends keyof MitarbeiterData>(key: K, value: MitarbeiterData[K]) => {
    setApp((prev) => ({
      ...prev,
      mitarbeiter: prev.mitarbeiter.map((m) => (m.id === activeId ? { ...m, [key]: value } : m)),
    }));
  };

  const updateAusbildung = (index: number, field: string, value: string) => {
    setApp((prev) => ({
      ...prev,
      mitarbeiter: prev.mitarbeiter.map((m) => {
        if (m.id !== activeId) return m;
        const newArr = [...m.ausbildungen];
        newArr[index] = { ...newArr[index], [field]: value };
        return { ...m, ausbildungen: newArr };
      }),
    }));
  };

  const updateWerdegang = (index: number, field: string, value: string) => {
    setApp((prev) => ({
      ...prev,
      mitarbeiter: prev.mitarbeiter.map((m) => {
        if (m.id !== activeId) return m;
        const newArr = [...m.werdegang];
        newArr[index] = { ...newArr[index], [field]: value };
        return { ...m, werdegang: newArr };
      }),
    }));
  };

  const addMitarbeiter = () => {
    const neu = defaultMitarbeiterData();
    setApp((prev) => ({ ...prev, mitarbeiter: [...prev.mitarbeiter, neu] }));
    setActiveId(neu.id);
  };

  const removeMitarbeiter = (id: string) => {
    if (app.mitarbeiter.length <= 1) return;
    const target = app.mitarbeiter.find((m) => m.id === id);
    if (target && !isMitarbeiterEmpty(target)) {
      const label = mitarbeiterLabel(target, app.mitarbeiter.findIndex((m) => m.id === id));
      if (!confirm(`"${label}" wirklich entfernen? Alle erfassten Daten gehen verloren.`)) return;
    }
    setApp((prev) => {
      const next = prev.mitarbeiter.filter((m) => m.id !== id);
      return { ...prev, mitarbeiter: next };
    });
    if (id === activeId) {
      const fallback = app.mitarbeiter.find((m) => m.id !== id);
      if (fallback) setActiveId(fallback.id);
    }
  };

  const mergeParsedCv = (id: string, parsed: ParsedCv) => {
    setApp((prev) => ({
      ...prev,
      mitarbeiter: prev.mitarbeiter.map((m) => {
        if (m.id !== id) return m;
        const next: MitarbeiterData = { ...m };

        if (parsed.schulbildung && !next.schulbildung) {
          const allowed = schulbildungOptions.map((o) => o.value);
          if (allowed.includes(parsed.schulbildung)) next.schulbildung = parsed.schulbildung;
        }

        if (Array.isArray(parsed.ausbildungen) && parsed.ausbildungen.length > 0) {
          const merged = [...next.ausbildungen];
          parsed.ausbildungen.forEach((p, i) => {
            const slot = merged[i];
            if (!slot || (!slot.vonBis && !slot.ausbildungsstaette && !slot.ausbildungAls && !slot.abschluss)) {
              merged[i] = {
                vonBis: p.vonBis || '',
                ausbildungsstaette: p.ausbildungsstaette || '',
                ausbildungAls: p.ausbildungAls || '',
                abschluss: (p.abschluss === 'ja' || p.abschluss === 'nein') ? p.abschluss : '',
              };
            }
          });
          next.ausbildungen = merged;
        }

        if (Array.isArray(parsed.werdegang) && parsed.werdegang.length > 0) {
          const merged = [...next.werdegang];
          parsed.werdegang.forEach((p, i) => {
            const slot = merged[i];
            if (!slot || (!slot.vonBis && !slot.arbeitgeber && !slot.taetigkeitAls)) {
              merged[i] = {
                vonBis: p.vonBis || '',
                arbeitgeber: p.arbeitgeber || '',
                taetigkeitAls: p.taetigkeitAls || '',
              };
            }
          });
          next.werdegang = merged;
        }

        return next;
      }),
    }));
  };

  const parseCv = async (id: string, dataUrl: string, fileName: string) => {
    setCvParseStatus((s) => ({ ...s, [id]: { status: 'parsing' } }));
    try {
      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, dataUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setCvParseStatus((s) => ({ ...s, [id]: { status: 'error', error: json.error || `Fehler ${res.status}` } }));
        return;
      }
      mergeParsedCv(id, json.parsed as ParsedCv);
      setCvParseStatus((s) => ({ ...s, [id]: { status: 'ok' } }));
    } catch (err) {
      console.error(err);
      setCvParseStatus((s) => ({ ...s, [id]: { status: 'error', error: 'Netzwerkfehler' } }));
    }
  };

  const setVertical = (v: '' | 'marketing' | 'sales' | 'ki') => {
    setApp((prev) => ({
      ...prev,
      mitarbeiter: prev.mitarbeiter.map((m) =>
        m.id === activeId ? { ...m, vertical: v, selectedModules: [] } : m,
      ),
    }));
  };

  const toggleModule = (moduleId: string) => {
    setApp((prev) => ({
      ...prev,
      mitarbeiter: prev.mitarbeiter.map((m) => {
        if (m.id !== activeId) return m;
        const next = m.selectedModules.includes(moduleId)
          ? m.selectedModules.filter((id) => id !== moduleId)
          : [...m.selectedModules, moduleId];
        return { ...m, selectedModules: next };
      }),
    }));
  };

  const toggleTag = (field: 'notwendigkeit' | 'bezug', tag: string) => {
    setApp((prev) => ({
      ...prev,
      mitarbeiter: prev.mitarbeiter.map((m) => {
        if (m.id !== activeId) return m;
        const arr = m[field];
        const next = arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag];
        return { ...m, [field]: next };
      }),
    }));
  };

  const [generatingBegruendung, setGeneratingBegruendung] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!data.vertical || data.selectedModules.length === 0) return;
    const sel = summary(data.vertical, data.selectedModules);
    const inhalte = sel.modules.map((m) => `${m.code}: ${m.name}`).join(', ');
    const wochen = data.zeitmodell === 'tz' ? sel.tzWochen : sel.vzWochen;
    const dauer = `${wochen} Wochen ${data.zeitmodell === 'tz' ? 'Teilzeit' : 'Vollzeit'} (${sel.ue} UE)`;
    if (data.qualifizierungsInhalte !== inhalte) update('qualifizierungsInhalte', inhalte);
    if (data.weiterbildungsDauer !== dauer) update('weiterbildungsDauer', dauer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.vertical, data.selectedModules.join(','), data.zeitmodell, activeId]);

  const generateBegruendung = async () => {
    if (!data.vertical) return;
    const id = data.id;
    setGeneratingBegruendung((s) => ({ ...s, [id]: true }));
    try {
      const moduleNames = data.selectedModules
        .map((mid) => {
          const mod = getModule(mid);
          return mod ? `${mod.code}: ${mod.name}` : null;
        })
        .filter((n): n is string => !!n);

      const res = await fetch('/api/generate-begruendung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical: data.vertical,
          moduleNames,
          notwendigkeit: data.notwendigkeit
            .map((t) => NOTWENDIGKEIT_OPTIONS.find((o) => o.id === t)?.label as string | undefined)
            .filter((l): l is string => !!l),
          notwendigkeitFreitext: data.notwendigkeitFreitext.trim(),
          bezug: data.bezug
            .map((t) => BEZUG_OPTIONS.find((o) => o.id === t)?.label as string | undefined)
            .filter((l): l is string => !!l),
          bezugFreitext: data.bezugFreitext.trim(),
          vorname: data.vorname,
          nachname: data.nachname,
          beschaeftigungAls: data.beschaeftigungAls,
          branche: betrieb.branche,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        update('begruendung', json.begruendung);
      } else {
        alert(json.error || 'Fehler bei der Generierung.');
      }
    } catch (err) {
      console.error(err);
      alert('Netzwerkfehler.');
    } finally {
      setGeneratingBegruendung((s) => ({ ...s, [id]: false }));
    }
  };

  const generatePdf = async () => {
    setLoading(true);
    try {
      const payload = { ...betrieb, ...data };
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('PDF-Generierung fehlgeschlagen');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QCG-Erhebungsbogen_${data.nachname || mitarbeiterLabel(data, activeIndex)}.pdf`;
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
    { title: 'Betrieb', icon: '1' },
    { title: 'Persönliche Daten', icon: '2' },
    { title: 'Bildung & Werdegang', icon: '3' },
    { title: 'Qualifizierung', icon: '4' },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Topbar */}
      <div className="bg-green-800 text-white sticky top-0 z-50 px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center font-serif text-base">Q</div>
          <div className="text-sm font-medium truncate">Talentspring · QCG Erhebungsbogen</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-[12px] text-white/70">Bundesagentur für Arbeit</span>
          <span className="bg-white/15 rounded-full px-3.5 py-1.5 text-xs font-medium">100 % förderbar</span>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-[880px] mx-auto px-6 pt-16 pb-10 text-center">
        <span className="inline-flex items-center gap-2 bg-mint-200 text-green-900 rounded-full px-4 py-2 text-sm font-medium mb-7 before:content-['✓'] before:font-bold">
          100 % förderbar mit Bildungsgutschein
        </span>
        <h1 className="font-serif font-normal text-[clamp(34px,5.2vw,60px)] leading-[1.05] tracking-[-0.02em] text-ink mb-5">
          Beantrage <em className="not-italic font-serif italic text-green-700" style={{ fontVariationSettings: '"opsz" 144' }}>Weiterbildung</em>
          <br />für deine Mitarbeiter — in 15 Minuten.
        </h1>
        <p className="max-w-[580px] mx-auto text-ink-soft text-[17px] leading-[1.55]">
          Erhebungsbogen zur Prüfung eines möglichen Anspruchs auf Weiterbildungsförderung Beschäftigter nach dem Qualifizierungschancengesetz.
        </p>
      </section>

      {/* Shell */}
      <div className="max-w-[880px] mx-auto px-6">
        {/* Progress Steps */}
        <div className="bg-white border border-mint-200 rounded-[18px] p-3.5 shadow-[var(--shadow-sm)] flex gap-1 mb-4">
          {steps.map((s, i) => {
            const active = step === i;
            const done = i < step;
            return (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                  active ? 'text-green-900 font-semibold' : 'text-ink-mute hover:bg-mint-50 hover:text-ink'
                }`}
              >
                <span
                  className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    active
                      ? 'bg-green-800 text-white'
                      : done
                        ? 'bg-green-700 text-white'
                        : 'bg-mint-200 text-green-800'
                  }`}
                >
                  {done ? '✓' : s.icon}
                </span>
                <span className="hidden sm:inline whitespace-nowrap">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <div>

          {/* Step 1: Betrieb */}
          {step === 0 && (
            <div className="qcg-card p-5 sm:p-7">
              <h2 className="font-serif text-[24px] font-medium text-ink leading-tight mb-1">Angaben zum Betrieb</h2>
              <p className="text-sm text-ink-mute mb-5">Diese Angaben gelten für alle Mitarbeiter.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Firma">
                  <Input value={betrieb.firma} onChange={(v) => updateBetrieb('firma', v)} />
                </FieldGroup>
                <FieldGroup label="Branche">
                  <BrancheSelect value={betrieb.branche} onChange={(v) => updateBetrieb('branche', v)} />
                </FieldGroup>
                <FieldGroup label="Anschrift" className="sm:col-span-2">
                  <Input value={betrieb.firmaAnschrift} onChange={(v) => updateBetrieb('firmaAnschrift', v)} />
                </FieldGroup>
                <FieldGroup label="Ansprechpartner">
                  <Input value={betrieb.ansprechpartner} onChange={(v) => updateBetrieb('ansprechpartner', v)} />
                </FieldGroup>
                <FieldGroup label="Telefon">
                  <Input type="tel" value={betrieb.firmaTelefon} onChange={(v) => updateBetrieb('firmaTelefon', v)} />
                </FieldGroup>
                <FieldGroup label="Anzahl sozialvers. pflichtige Mitarbeiter (ohne Azubi)">
                  <Input type="number" value={betrieb.anzahlMitarbeiter} onChange={(v) => updateBetrieb('anzahlMitarbeiter', v)} />
                </FieldGroup>
                <FieldGroup label="Betriebs-Nr.">
                  <Input value={betrieb.betriebsNr} onChange={(v) => updateBetrieb('betriebsNr', v)} />
                </FieldGroup>
              </div>
            </div>
          )}

          {/* Mitarbeiter-Chips für Steps 2-4 */}
          {step > 0 && (
            <div className="bg-mint-50 border border-mint-200 rounded-[18px] px-5 py-4 mb-4 flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] uppercase tracking-[0.1em] text-green-800 font-semibold mr-1.5">Mitarbeiter</span>
              {app.mitarbeiter.map((m, i) => {
                const active = m.id === activeId;
                const label = mitarbeiterLabel(m, i);
                return (
                  <div
                    key={m.id}
                    className={`inline-flex items-center rounded-full text-[13px] border transition-colors ${
                      active
                        ? 'bg-green-800 text-white border-green-800'
                        : 'bg-white text-ink border-mint-300 hover:border-green-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveId(m.id)}
                      className="flex items-center gap-1.5 pl-3.5 pr-2 py-1.5 font-medium"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-mint-300' : 'bg-green-700'}`} />
                      {label}
                    </button>
                    {app.mitarbeiter.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMitarbeiter(m.id);
                        }}
                        aria-label={`${label} entfernen`}
                        className={`pr-3 pl-1 py-1.5 text-xs ${
                          active ? 'text-white/70 hover:text-white' : 'text-ink-mute hover:text-ink'
                        }`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addMitarbeiter}
                className="qcg-chip qcg-chip-add"
              >
                <span className="text-base leading-none">+</span> Mitarbeiter
              </button>
            </div>
          )}

          {/* Step 2: Persönliche Daten */}
          {step === 1 && (() => {
            const showAufenthalt = data.staatsangehoerigkeit.length > 0 && !data.staatsangehoerigkeit.includes('deutsch');
            const sec1Done = !!(data.nachname && data.vorname && data.geburtsdatum && data.geschlecht && data.familienstand);
            const sec2Done = !!(data.plzWohnort && data.strHausNr && (data.telefon || data.handy));
            const sec3Done = data.staatsangehoerigkeit.length > 0 && !!data.behinderungVor && !!data.arbeitsverhaeltnis &&
              (!showAufenthalt || (!!data.aufenthaltsstatus && !!data.arbeitsmarktzugang));
            const sec4Done = !!(data.befristet && data.beschaeftigungAls && data.helferebene && data.svPflichtig);
            const tab = 1;
            const active = activeSection[tab];

            return (
              <div>
                <Section
                  index={1} total={4} title="Stammdaten"
                  isOpen={active === 0} isComplete={sec1Done}
                  summary={sec1Done ? `${data.vorname} ${data.nachname}, geb. ${data.geburtsdatum || '—'}` : undefined}
                  onToggle={() => openSection(tab, 0)}
                  onContinue={() => goToSection(tab, 1)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Nachname"><Input value={data.nachname} onChange={(v) => update('nachname', v)} placeholder="Nachname" /></FieldGroup>
                    <FieldGroup label="Vorname"><Input value={data.vorname} onChange={(v) => update('vorname', v)} placeholder="Vorname" /></FieldGroup>
                    <FieldGroup label="Geburtsname"><Input value={data.geburtsname} onChange={(v) => update('geburtsname', v)} placeholder="Geburtsname" /></FieldGroup>
                    <FieldGroup label="Geschlecht">
                      <RadioGroup
                        options={[{ value: 'maennl', label: 'männlich' }, { value: 'weibl', label: 'weiblich' }, { value: 'div', label: 'divers' }]}
                        value={data.geschlecht}
                        onChange={(v) => update('geschlecht', v as MitarbeiterData['geschlecht'])}
                      />
                    </FieldGroup>
                    <FieldGroup label="Geburtsdatum"><Input type="date" value={data.geburtsdatum} onChange={(v) => update('geburtsdatum', v)} /></FieldGroup>
                    <FieldGroup label="Geburtsort"><Input value={data.geburtsort} onChange={(v) => update('geburtsort', v)} placeholder="Geburtsort" /></FieldGroup>
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
                      onChange={(v) => update('familienstand', v as MitarbeiterData['familienstand'])}
                    />
                  </FieldGroup>
                </Section>

                <Section
                  index={2} total={4} title="Adresse & Kontakt"
                  isOpen={active === 1} isComplete={sec2Done}
                  summary={sec2Done ? `${data.plzWohnort} · ${data.telefon || data.handy}` : undefined}
                  onToggle={() => openSection(tab, 1)}
                  onContinue={() => goToSection(tab, 2)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="PLZ, Wohnort"><Input value={data.plzWohnort} onChange={(v) => update('plzWohnort', v)} placeholder="12345 Berlin" /></FieldGroup>
                    <FieldGroup label="Straße, Haus-Nr."><Input value={data.strHausNr} onChange={(v) => update('strHausNr', v)} placeholder="Musterstraße 1" /></FieldGroup>
                    <FieldGroup label="Telefon"><Input type="tel" value={data.telefon} onChange={(v) => update('telefon', v)} placeholder="030 123456" /></FieldGroup>
                    <FieldGroup label="Handy"><Input type="tel" value={data.handy} onChange={(v) => update('handy', v)} placeholder="0170 1234567" /></FieldGroup>
                    <FieldGroup label="Renten-/Sozialversicherungs-Nr."><Input value={data.rentenSvNr} onChange={(v) => update('rentenSvNr', v)} /></FieldGroup>
                    <FieldGroup label="Kunden-Nr. (falls bekannt)"><Input value={data.kundenNr} onChange={(v) => update('kundenNr', v)} /></FieldGroup>
                  </div>
                </Section>

                <Section
                  index={3} total={4} title="Staat, Aufenthalt & Behinderung"
                  isOpen={active === 2} isComplete={sec3Done}
                  summary={sec3Done ? `${data.staatsangehoerigkeit.join(', ')}${data.behinderungVor === 'ja' ? ' · Behinderung' : ''}` : undefined}
                  onToggle={() => openSection(tab, 2)}
                  onContinue={() => goToSection(tab, 3)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Staatsangehörigkeit">
                      <StaatsangehoerigkeitSelect value={data.staatsangehoerigkeit} onChange={(v) => update('staatsangehoerigkeit', v)} />
                    </FieldGroup>
                    <FieldGroup label="Grenzgänger">
                      <RadioGroup
                        options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                        value={data.grenzgaenger}
                        onChange={(v) => update('grenzgaenger', v as MitarbeiterData['grenzgaenger'])}
                      />
                    </FieldGroup>
                  </div>

                  <FieldGroup label="Liegt eine Behinderung vor?" className="mt-4">
                    <RadioGroup
                      options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                      value={data.behinderungVor}
                      onChange={(v) => {
                        update('behinderungVor', v as MitarbeiterData['behinderungVor']);
                        if (v === 'nein') update('gradBehinderung', '');
                      }}
                    />
                  </FieldGroup>
                  {data.behinderungVor === 'ja' && (
                    <FieldGroup label="Grad der Behinderung" className="mt-4">
                      <RadioGroup
                        options={[{ value: 'schwerbehindert', label: 'schwerbehindert' }, { value: 'gleichgestellt', label: 'gleichgestellt' }]}
                        value={data.gradBehinderung}
                        onChange={(v) => update('gradBehinderung', v as MitarbeiterData['gradBehinderung'])}
                      />
                    </FieldGroup>
                  )}

                  {showAufenthalt && (
                    <div className="mt-6 p-4 bg-mint-50 rounded-[14px] border border-mint-200">
                      <h3 className="font-serif text-base font-medium text-ink mb-1">Aufenthaltsrechtliche Informationen</h3>
                      <p className="text-xs text-ink-mute mb-3">Zusätzliche Angaben bei ausländischen Arbeitnehmern</p>
                      <FieldGroup label="Aufenthaltsstatus" className="mb-3">
                        <RadioGroup
                          options={[
                            { value: 'niederlassungserlaubnis', label: 'Niederlassungserlaubnis' },
                            { value: 'duldung', label: 'Duldung' },
                            { value: 'aufenthaltserlaubnis', label: 'Aufenthaltserlaubnis' },
                          ]}
                          value={data.aufenthaltsstatus}
                          onChange={(v) => update('aufenthaltsstatus', v as MitarbeiterData['aufenthaltsstatus'])}
                        />
                      </FieldGroup>
                      <FieldGroup label="Arbeitsmarktzugang / Erwerbstätigkeit gestattet">
                        <div className="flex flex-wrap items-center gap-4">
                          <RadioGroup
                            options={[{ value: 'unbefristet', label: 'unbefristet' }, { value: 'befristet', label: 'befristet' }]}
                            value={data.arbeitsmarktzugang}
                            onChange={(v) => update('arbeitsmarktzugang', v as MitarbeiterData['arbeitsmarktzugang'])}
                          />
                          {data.arbeitsmarktzugang === 'befristet' && (
                            <Input type="date" value={data.arbeitsmarktzugangBis} onChange={(v) => update('arbeitsmarktzugangBis', v)} />
                          )}
                        </div>
                      </FieldGroup>
                    </div>
                  )}

                  <FieldGroup label="Arbeitsverhältnis während Bildungsmaßnahme" className="mt-4">
                    <p className="text-xs text-ink-mute mb-1">Ich stehe in einem Arbeitsverhältnis und habe für die Dauer der Bildungsmaßnahme weiterhin Anspruch auf Arbeitsentgelt</p>
                    <RadioGroup
                      options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                      value={data.arbeitsverhaeltnis}
                      onChange={(v) => update('arbeitsverhaeltnis', v as MitarbeiterData['arbeitsverhaeltnis'])}
                    />
                  </FieldGroup>
                </Section>

                <Section
                  index={4} total={4} title="Beschäftigungsverhältnis"
                  isOpen={active === 3} isComplete={sec4Done}
                  summary={sec4Done ? data.beschaeftigungAls : undefined}
                  onToggle={() => openSection(tab, 3)}
                  isLast
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Befristete Beschäftigung">
                      <RadioGroup
                        options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                        value={data.befristet}
                        onChange={(v) => update('befristet', v as MitarbeiterData['befristet'])}
                      />
                    </FieldGroup>
                    {data.befristet === 'ja' && (
                      <FieldGroup label="Befristet bis">
                        <Input type="date" value={data.befristetBis} onChange={(v) => update('befristetBis', v)} />
                      </FieldGroup>
                    )}
                    <FieldGroup label="Beschäftigung als"><Input value={data.beschaeftigungAls} onChange={(v) => update('beschaeftigungAls', v)} /></FieldGroup>
                    <FieldGroup label="Beschäftigung auf Helferebene">
                      <RadioGroup
                        options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                        value={data.helferebene}
                        onChange={(v) => update('helferebene', v as MitarbeiterData['helferebene'])}
                      />
                    </FieldGroup>
                    <FieldGroup label="SV-pflichtige Beschäftigung">
                      <RadioGroup
                        options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                        value={data.svPflichtig}
                        onChange={(v) => update('svPflichtig', v as MitarbeiterData['svPflichtig'])}
                      />
                    </FieldGroup>
                    <FieldGroup label="Anzahl SV-pflichtige Mitarbeiter (ohne Azubi)">
                      <Input type="number" value={data.anzahlSvMitarbeiter} onChange={(v) => update('anzahlSvMitarbeiter', v)} />
                    </FieldGroup>
                  </div>
                  <div className="mt-4 p-4 bg-mint-50 rounded-[14px] border border-mint-200 text-xs text-ink-soft">
                    <strong className="text-green-900">Hinweis zur Betriebsgröße:</strong> Nicht berücksichtigt werden Auszubildende, Praktikanten und geringfügig Beschäftigte. Teilzeitbeschäftigte: bis 10h/Woche = 0,25, bis 20h = 0,5, bis 30h = 0,75.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FieldGroup label="Bezug von Kurzarbeitergeld">
                      <RadioGroup
                        options={[{ value: 'ja', label: 'ja' }, { value: 'nein', label: 'nein' }]}
                        value={data.kurzarbeitergeld}
                        onChange={(v) => update('kurzarbeitergeld', v as MitarbeiterData['kurzarbeitergeld'])}
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
                        onChange={(v) => update('transferKurzarbeitergeld', v as MitarbeiterData['transferKurzarbeitergeld'])}
                      />
                    </FieldGroup>
                    {data.transferKurzarbeitergeld === 'ja' && (
                      <FieldGroup label="Transfer-Kurzarbeitergeld ab">
                        <Input type="date" value={data.transferKurzarbeitergeldAb} onChange={(v) => update('transferKurzarbeitergeldAb', v)} />
                      </FieldGroup>
                    )}
                  </div>
                </Section>
              </div>
            );
          })()}

          {/* Step 3: Bildung & Werdegang */}
          {step === 2 && (() => {
            const cvDone = !!data.cvFileName && cvParseStatus[data.id]?.status === 'ok';
            const schulDone = !!data.schulbildung;
            const ausbDone = data.ausbildungen.some((a) => a.vonBis || a.ausbildungAls);
            const werdDone = data.werdegang.some((w) => w.vonBis || w.arbeitgeber);
            const tab = 2;
            const active = activeSection[tab];

            return (
              <div>
                <Section
                  index={1} total={4} title="Lebenslauf hochladen (optional)"
                  isOpen={active === 0} isComplete={cvDone}
                  summary={data.cvFileName || 'übersprungen'}
                  onToggle={() => openSection(tab, 0)}
                  onContinue={() => goToSection(tab, 1)}
                >
                  <p className="text-sm text-ink-mute mb-4">Lade einen Lebenslauf hoch — wir extrahieren Schulbildung, Ausbildung und Werdegang automatisch. Du kannst die Felder danach prüfen und ergänzen.</p>
                  <CvUpload
                    fileName={data.cvFileName}
                    status={cvParseStatus[data.id]?.status || 'idle'}
                    errorMsg={cvParseStatus[data.id]?.error}
                    onFile={(name, dataUrl) => {
                      update('cvFileName', name);
                      update('cvDataUrl', dataUrl);
                      parseCv(data.id, dataUrl, name);
                    }}
                    onClear={() => {
                      update('cvFileName', '');
                      update('cvDataUrl', '');
                      setCvParseStatus((s) => {
                        const next = { ...s };
                        delete next[data.id];
                        return next;
                      });
                    }}
                  />
                </Section>

                <Section
                  index={2} total={4} title="Schulbildung"
                  isOpen={active === 1} isComplete={schulDone}
                  summary={data.schulbildung ? schulbildungOptions.find((o) => o.value === data.schulbildung)?.label : undefined}
                  onToggle={() => openSection(tab, 1)}
                  onContinue={() => goToSection(tab, 2)}
                >
                  <p className="text-sm text-ink-mute mb-4">Höchster Bildungsabschluss</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {schulbildungOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-[14px] border cursor-pointer transition-colors ${
                          data.schulbildung === opt.value
                            ? 'border-green-800 bg-mint-100 text-green-900'
                            : 'border-mint-300 bg-white hover:border-green-700 hover:bg-mint-50 text-ink'
                        }`}
                      >
                        <span className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          data.schulbildung === opt.value ? 'border-green-800' : 'border-mint-300'
                        }`}>
                          {data.schulbildung === opt.value && <span className="w-2 h-2 rounded-full bg-green-800" />}
                        </span>
                        <span className="text-sm font-medium">{opt.label}</span>
                        <input type="radio" className="sr-only" checked={data.schulbildung === opt.value} onChange={() => update('schulbildung', opt.value)} />
                      </label>
                    ))}
                  </div>
                </Section>

                <Section
                  index={3} total={4} title="Berufliche Aus- und Weiterbildung"
                  isOpen={active === 2} isComplete={ausbDone}
                  summary={ausbDone ? `${data.ausbildungen.filter((a) => a.vonBis || a.ausbildungAls).length} Eintrag/Einträge` : undefined}
                  onToggle={() => openSection(tab, 2)}
                  onContinue={() => goToSection(tab, 3)}
                >
                  <div className="space-y-3">
                    {data.ausbildungen.map((a, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-mint-50 rounded-[14px] border border-mint-200">
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
                </Section>

                <Section
                  index={4} total={4} title="Beruflicher Werdegang"
                  isOpen={active === 3} isComplete={werdDone}
                  summary={werdDone ? `${data.werdegang.filter((w) => w.vonBis || w.arbeitgeber).length} Eintrag/Einträge` : undefined}
                  onToggle={() => openSection(tab, 3)}
                  isLast
                >
                  <p className="text-sm text-ink-mute mb-4">Letzte 7 Jahre — auch Zeiten ohne Erwerbstätigkeit angeben.</p>
                  <div className="space-y-3">
                    {data.werdegang.map((w, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-mint-50 rounded-[14px] border border-mint-200">
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
                </Section>
              </div>
            );
          })()}

          {/* Step 4: Qualifizierung */}
          {step === 3 && (() => {
            const sel = data.vertical ? summary(data.vertical, data.selectedModules) : null;
            const validCombo = data.vertical ? isValidCombo(data.vertical, data.selectedModules) : false;
            const wochen = sel ? (data.zeitmodell === 'tz' ? sel.tzWochen : sel.vzWochen) : 0;
            const isGenerating = !!generatingBegruendung[data.id];

            const sec1Done = !!data.vertical && validCombo;
            const sec2Done = data.notwendigkeit.length > 0 && data.bezug.length > 0;
            const sec3Done = !!data.begruendung;
            const tab = 3;
            const active = activeSection[tab];

            const sec1Summary = data.vertical
              ? `${getVertical(data.vertical).label} · ${sel?.modules.length || 0} Modul(e) · ${sel?.preis.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0,00'} €`
              : undefined;

            return (
              <div>
                <Section
                  index={1} total={3} title="Vertical & Module"
                  isOpen={active === 0} isComplete={sec1Done}
                  summary={sec1Summary}
                  onToggle={() => openSection(tab, 0)}
                  onContinue={() => goToSection(tab, 1)}
                >
                  <p className="text-sm text-ink-mute mb-4">Wähle den Schwerpunkt und die Module der Weiterbildung.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
                    {VERTICALS.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setVertical(v.key)}
                        className={`text-left p-4 rounded-[14px] border transition-colors ${
                          data.vertical === v.key
                            ? 'border-green-800 bg-mint-100'
                            : 'border-mint-300 bg-white hover:border-green-700 hover:bg-mint-50'
                        }`}
                      >
                        <div className={`font-serif text-base font-medium ${data.vertical === v.key ? 'text-green-900' : 'text-ink'}`}>
                          {data.vertical === v.key && <span className="text-green-800 mr-1">✓</span>}{v.label}
                        </div>
                        <div className="text-xs text-ink-mute mt-1">
                          {v.modules.length} Modul{v.modules.length === 1 ? '' : 'e'}
                        </div>
                      </button>
                    ))}
                  </div>

                  {data.vertical && (
                    <>
                      <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-green-800 mb-3">Module</div>
                      {data.vertical === 'ki' && (
                        <p className="text-sm text-ink-mute mb-4">
                          KI 1 Grundlagen ist Pflicht. Du kannst nur KI 1 wählen, den <strong className="text-green-900">Marketing-Track</strong> (KI 1 + 2a, optional + 2b) oder den <strong className="text-green-900">Vertriebs-Track</strong> (KI 1 + 3a, optional + 3b).
                        </p>
                      )}
                      <div className="space-y-2.5 mb-5">
                        {getVertical(data.vertical).modules.map((mod) => {
                          const checked = data.selectedModules.includes(mod.id);
                          return (
                            <label
                              key={mod.id}
                              className={`flex items-start gap-3 p-4 rounded-[14px] border cursor-pointer transition-colors ${
                                checked ? 'border-green-800 bg-mint-100' : 'border-mint-300 bg-white hover:border-green-700 hover:bg-mint-50'
                              }`}
                            >
                              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleModule(mod.id)} />
                              <span className={`mt-0.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                checked ? 'border-green-800 bg-green-800' : 'border-mint-300'
                              }`}>
                                {checked && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-baseline gap-x-2">
                                  <span className={`text-sm font-semibold ${checked ? 'text-green-900' : 'text-ink'}`}>{mod.code}</span>
                                  <span className={`text-sm ${checked ? 'text-green-900' : 'text-ink'}`}>{mod.name}</span>
                                  {mod.pflicht && (
                                    <span className="text-[10px] uppercase tracking-wide text-green-900 bg-mint-200 px-2 py-0.5 rounded-full">Pflicht</span>
                                  )}
                                </div>
                                <div className="text-xs text-ink-mute mt-0.5">
                                  {mod.ue} UE · TZ {mod.tzWochen} Wo. · VZ {mod.vzWochen} Wo. · {mod.preis.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {sel && sel.modules.length > 0 && (
                        <div className={`p-5 rounded-[14px] border ${
                          validCombo ? 'bg-mint-100 border-green-700' : 'bg-amber-50 border-amber-300'
                        }`}>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <div className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${
                              validCombo ? 'text-green-900' : 'text-amber-800'
                            }`}>
                              {validCombo ? '✓ Gültige Modul-Kombination' : '⚠ Kombination nicht zugelassen'}
                            </div>
                            <div className="inline-flex bg-white border border-mint-300 rounded-full p-1 text-xs">
                              <button
                                type="button"
                                onClick={() => update('zeitmodell', 'tz')}
                                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                  data.zeitmodell === 'tz' ? 'bg-green-800 text-white' : 'text-ink-soft hover:text-ink'
                                }`}
                              >
                                Teilzeit
                              </button>
                              <button
                                type="button"
                                onClick={() => update('zeitmodell', 'vz')}
                                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                                  data.zeitmodell === 'vz' ? 'bg-green-800 text-white' : 'text-ink-soft hover:text-ink'
                                }`}
                              >
                                Vollzeit
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="qcg-label">Module</div>
                              <div className="font-serif text-xl font-medium text-green-900 mt-1">{sel.modules.length}</div>
                            </div>
                            <div>
                              <div className="qcg-label">Unterrichtseinheiten</div>
                              <div className="font-serif text-xl font-medium text-green-900 mt-1">{sel.ue} UE</div>
                            </div>
                            <div>
                              <div className="qcg-label">Dauer ({data.zeitmodell === 'tz' ? 'TZ' : 'VZ'})</div>
                              <div className="font-serif text-xl font-medium text-green-900 mt-1">{wochen} Wo.</div>
                            </div>
                            <div>
                              <div className="qcg-label">Gesamtpreis</div>
                              <div className="font-serif text-xl font-medium text-green-900 mt-1">{sel.preis.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
                            </div>
                          </div>
                          {!validCombo && (
                            <p className="text-xs text-amber-800 mt-3">
                              Diese Modulkombination ist im Förderkatalog nicht vorgesehen — bitte Auswahl anpassen.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </Section>

                <Section
                  index={2} total={3} title="Notwendigkeit & Bezug"
                  isOpen={active === 1} isComplete={sec2Done}
                  summary={sec2Done ? `${data.notwendigkeit.length} Notwendigkeit · ${data.bezug.length} Bezug` : undefined}
                  onToggle={() => openSection(tab, 1)}
                  onContinue={() => goToSection(tab, 2)}
                >
                  <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-green-800 mb-3">Notwendigkeit der Förderung</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                    {NOTWENDIGKEIT_OPTIONS.map((opt) => {
                      const checked = data.notwendigkeit.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleTag('notwendigkeit', opt.id)}
                          className={`qcg-tag ${checked ? 'qcg-tag-checked' : ''}`}
                        >
                          <div className="text-sm font-semibold text-ink mb-1">
                            {checked && <span className="text-green-800 mr-1">✓</span>}{opt.label}
                          </div>
                          <div className="text-xs text-ink-mute">{opt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={data.notwendigkeitFreitext}
                    onChange={(e) => update('notwendigkeitFreitext', e.target.value)}
                    rows={2}
                    placeholder="Optional: weiterer wichtiger Punkt zur Notwendigkeit (fließt in die KI-Begründung ein)"
                    className="qcg-input resize-y mb-6 leading-[1.55]"
                  />

                  <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-green-800 mb-3">Bezug zum Mitarbeiter</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                    {BEZUG_OPTIONS.map((opt) => {
                      const checked = data.bezug.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleTag('bezug', opt.id)}
                          className={`qcg-tag ${checked ? 'qcg-tag-checked' : ''}`}
                        >
                          <div className="text-sm font-semibold text-ink mb-1">
                            {checked && <span className="text-green-800 mr-1">✓</span>}{opt.label}
                          </div>
                          <div className="text-xs text-ink-mute">{opt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={data.bezugFreitext}
                    onChange={(e) => update('bezugFreitext', e.target.value)}
                    rows={2}
                    placeholder="Optional: weiterer Bezug zum Mitarbeiter (fließt in die KI-Begründung ein)"
                    className="qcg-input resize-y leading-[1.55]"
                  />
                </Section>

                <Section
                  index={3} total={3} title="Begründung der Fördernotwendigkeit"
                  isOpen={active === 2} isComplete={sec3Done}
                  summary={sec3Done ? `${data.begruendung.slice(0, 80)}…` : undefined}
                  onToggle={() => openSection(tab, 2)}
                  isLast
                >
                  {(() => {
                    const missing: string[] = [];
                    if (!validCombo) missing.push('eine gültige Modul-Kombination (Schritt 1)');
                    if (data.notwendigkeit.length === 0) missing.push('mindestens eine Notwendigkeit (Schritt 2)');
                    const isDisabled = isGenerating || missing.length > 0;
                    return (
                      <div className="mb-3 flex flex-col items-end gap-1.5">
                        <button
                          type="button"
                          onClick={generateBegruendung}
                          disabled={isDisabled}
                          className="qcg-ai-btn"
                        >
                          {isGenerating ? (
                            <>
                              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              generiere…
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" fill="currentColor" />
                              </svg>
                              Mit KI generieren
                            </>
                          )}
                        </button>
                        {missing.length > 0 && !isGenerating && (
                          <p className="text-xs text-ink-mute text-right">
                            Bitte erst {missing.join(' und ')} ergänzen.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  <textarea
                    value={data.begruendung}
                    onChange={(e) => update('begruendung', e.target.value)}
                    rows={5}
                    placeholder="Klicke auf 'Mit KI generieren' oder schreibe selbst…"
                    className="qcg-input resize-y leading-[1.6]"
                  />
                </Section>

                <div className="mt-6 p-4 bg-mint-50 rounded-[14px] border border-mint-200 text-xs text-ink-soft leading-[1.6]">
                  <strong className="text-green-900">Hinweise zum Datenschutz:</strong> Mit dem Absenden bestätigen Sie die Richtigkeit der Angaben und die Kenntnisnahme der Hinweise zum Datenschutz unter arbeitsagentur.de/datenerhebung. Sie erklären sich mit der Verarbeitung Ihrer persönlichen Daten zum Zwecke der Abklärung bestehender Fördermöglichkeiten durch die Bundesagentur für Arbeit einverstanden.
                </div>
              </div>
            );
          })()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-mint-200">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="qcg-btn-ghost"
            >
              ← Zurück
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="qcg-btn"
              >
                Weiter →
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {app.mitarbeiter.length > 1 && (
                  <button
                    type="button"
                    disabled
                    title="kommt später"
                    className="qcg-btn-ghost"
                  >
                    Alle als ZIP ({app.mitarbeiter.length})
                  </button>
                )}
                <button
                  onClick={generatePdf}
                  disabled={loading}
                  className="qcg-submit"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      PDF wird erstellt…
                    </>
                  ) : (
                    <>PDF: {mitarbeiterLabel(data, activeIndex)} →</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
