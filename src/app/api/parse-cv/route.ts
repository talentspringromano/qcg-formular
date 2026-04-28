import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_RAW_BYTES = 8 * 1024 * 1024;

const SCHULBILDUNG_VALUES = [
  '', 'kein_abschluss', 'foerderschule', 'hauptschule', 'erweit_hauptschule',
  'mittlere_reife', 'klasse10_13', 'fachhochschulreife', 'fachabitur',
  'abitur', 'hochschule_ohne', 'fachhochschule', 'hochschule',
] as const;

const CV_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['schulbildung', 'ausbildungen', 'werdegang'],
  properties: {
    schulbildung: { type: 'string', enum: SCHULBILDUNG_VALUES },
    ausbildungen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['vonBis', 'ausbildungsstaette', 'ausbildungAls', 'abschluss'],
        properties: {
          vonBis: { type: 'string' },
          ausbildungsstaette: { type: 'string' },
          ausbildungAls: { type: 'string' },
          abschluss: { type: 'string', enum: ['', 'ja', 'nein'] },
        },
      },
    },
    werdegang: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['vonBis', 'arbeitgeber', 'taetigkeitAls'],
        properties: {
          vonBis: { type: 'string' },
          arbeitgeber: { type: 'string' },
          taetigkeitAls: { type: 'string' },
        },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `Du extrahierst aus einem Lebenslauf strukturierte Daten für ein deutsches Förderformular (Qualifizierungschancengesetz).

Ausgabe-Felder:

1. "schulbildung": Höchster Schulabschluss. Wähle GENAU EINEN Wert aus dieser Liste:
   - "" — keine Information im CV
   - "kein_abschluss" — Schule ohne Abschluss verlassen
   - "foerderschule" — Abschluss Förderschule
   - "hauptschule" — Hauptschulabschluss
   - "erweit_hauptschule" — erweiterter Hauptschulabschluss
   - "mittlere_reife" — Mittlere Reife / Realschulabschluss
   - "klasse10_13" — Klasse 10–13 ohne Abschluss
   - "fachhochschulreife" — Fachhochschulreife
   - "fachabitur" — Fachabitur
   - "abitur" — Abitur / allgemeine Hochschulreife
   - "hochschule_ohne" — Hochschule ohne Abschluss / Studienabbruch
   - "fachhochschule" — Fachhochschulabschluss (Bachelor/Master/Diplom an FH)
   - "hochschule" — Hochschul-/Universitätsabschluss (Bachelor/Master/Diplom/Promotion)

2. "ausbildungen": Berufsausbildungen, Studium, abgeschlossene Weiterbildungen mit Abschluss/Zertifikat. Reine Schulzeit gehört NICHT hierher.
   - "vonBis": Format "MM.YYYY – MM.YYYY" oder "MM.YYYY – heute"; nur "YYYY – YYYY" wenn keine Monate genannt sind. Leerstring wenn unklar.
   - "ausbildungsstaette": Name der Hochschule/Berufsschule/Bildungseinrichtung + Ort wenn genannt.
   - "ausbildungAls": Berufs-/Studienbezeichnung (z.B. "Industriekauffrau", "B.Sc. Informatik").
   - "abschluss": "ja" wenn abgeschlossen, "nein" wenn abgebrochen, "" wenn unklar.

3. "werdegang": Beruflicher Werdegang — Anstellungen, Selbständigkeit, Praktika, Elternzeit, Arbeitslosigkeit. Letzte ~7 Jahre priorisieren, ältere weglassen wenn nicht relevant.
   - "vonBis": gleiches Format wie oben.
   - "arbeitgeber": Firma + Ort (+ Branche in Klammern wenn klar).
   - "taetigkeitAls": Jobtitel / Rolle.

REGELN:
- Niemals halluzinieren. Wenn etwas nicht klar im CV steht: leerer String oder kürzeres Array.
- Reihenfolge in den Arrays: NEUESTE ZUERST.
- Antworte ausschließlich als JSON nach dem vorgegebenen Schema.`;

function dataUrlToParts(dataUrl: string): { mime: string; bytes: Buffer; base64: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  try {
    const bytes = Buffer.from(base64, 'base64');
    return { mime, bytes, base64 };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'ANTHROPIC_API_KEY ist nicht konfiguriert.' },
      { status: 500 },
    );
  }

  let body: { fileName?: string; dataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Ungültiger Request-Body.' }, { status: 400 });
  }

  const { dataUrl } = body;
  if (!dataUrl || typeof dataUrl !== 'string') {
    return NextResponse.json({ ok: false, error: 'Keine Datei übermittelt.' }, { status: 400 });
  }

  const parts = dataUrlToParts(dataUrl);
  if (!parts) {
    return NextResponse.json({ ok: false, error: 'Datei konnte nicht gelesen werden.' }, { status: 400 });
  }

  if (parts.bytes.length > MAX_RAW_BYTES) {
    return NextResponse.json({ ok: false, error: 'Datei zu groß (max. 8 MB).' }, { status: 413 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let userContent: Anthropic.Messages.ContentBlockParam[];

  if (parts.mime === 'application/pdf') {
    userContent = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: parts.base64 },
      },
      { type: 'text', text: 'Extrahiere die Lebenslauf-Daten gemäß Schema.' },
    ];
  } else if (
    parts.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    let text: string;
    try {
      const result = await mammoth.extractRawText({ buffer: parts.bytes });
      text = result.value;
    } catch {
      return NextResponse.json(
        { ok: false, error: 'DOCX konnte nicht gelesen werden.' },
        { status: 400 },
      );
    }
    if (!text.trim()) {
      return NextResponse.json(
        { ok: false, error: 'DOCX enthielt keinen lesbaren Text.' },
        { status: 422 },
      );
    }
    userContent = [
      { type: 'text', text: `Lebenslauf-Text:\n\n${text}\n\nExtrahiere die Daten gemäß Schema.` },
    ];
  } else if (parts.mime === 'application/msword') {
    return NextResponse.json(
      {
        ok: false,
        error: 'Altes .doc-Format nicht unterstützt — bitte als PDF oder DOCX exportieren.',
      },
      { status: 415 },
    );
  } else {
    return NextResponse.json(
      { ok: false, error: `Format nicht unterstützt: ${parts.mime}` },
      { status: 415 },
    );
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      output_config: {
        format: { type: 'json_schema', schema: CV_SCHEMA },
      },
      messages: [{ role: 'user', content: userContent }],
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.Messages.TextBlock => b.type === 'text',
    );
    if (!textBlock) {
      return NextResponse.json(
        { ok: false, error: 'Keine Antwort vom Modell.' },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Antwort war kein gültiges JSON.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      parsed,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cache_read: response.usage.cache_read_input_tokens ?? 0,
        cache_write: response.usage.cache_creation_input_tokens ?? 0,
      },
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { ok: false, error: 'Anthropic Rate Limit erreicht — bitte kurz warten.' },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { ok: false, error: `API-Fehler: ${err.message}` },
        { status: 502 },
      );
    }
    console.error('parse-cv unknown error:', err);
    return NextResponse.json({ ok: false, error: 'Unerwarteter Fehler.' }, { status: 500 });
  }
}
