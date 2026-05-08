import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface AusbildungEntry {
  vonBis?: string;
  ausbildungsstaette?: string;
  ausbildungAls?: string;
  abschluss?: 'ja' | 'nein' | '';
}

interface WerdegangEntry {
  vonBis?: string;
  arbeitgeber?: string;
  taetigkeitAls?: string;
}

interface RequestBody {
  vertical: 'marketing' | 'sales' | 'ki';
  moduleNames: string[];
  notwendigkeit: string[];
  notwendigkeitFreitext?: string;
  bezug: string[];
  bezugFreitext?: string;
  vorname?: string;
  nachname?: string;
  beschaeftigungAls?: string;
  branche?: string;
  schulbildung?: string;
  ausbildungen?: AusbildungEntry[];
  werdegang?: WerdegangEntry[];
}

const SYSTEM_PROMPT = `Du formulierst die "Begründung der Fördernotwendigkeit" für den deutschen Erhebungsbogen zum Qualifizierungschancengesetz (QCG).

Stil:
- Sachlicher, fachlicher Ton in deutscher Geschäftssprache
- 3–5 Sätze, **maximal** 6 Sätze, ein zusammenhängender Absatz
- Keine Bullet-Points, keine Überschriften, keine Anrede
- Konkret auf den Mitarbeiter und die gewählten Module bezogen
- Keine Phrasen wie "Hiermit beantragen wir…" — direkt mit der Notwendigkeit beginnen
- Nicht kreativ ausschmücken — nur das, was aus den gegebenen Daten ableitbar ist

Werdegang/Ausbildung/Schulbildung:
- Falls Werdegang oder Ausbildungen vorliegen, knapp zur Untermauerung des "Bezugs zur Person" nutzen (z. B. eine konkrete frühere Tätigkeit oder Ausbildungsrichtung referenzieren)
- Keine vollständige Aufzählung der Stationen, kein Lebenslauf-Abriss
- Maximal 1 konkrete Referenz aus dem Werdegang/der Ausbildung im Absatz

Antworte ausschließlich mit dem Fließtext der Begründung, ohne Einleitung oder Quotes.`;

function buildUserPrompt(b: RequestBody): string {
  const name = [b.vorname, b.nachname].filter(Boolean).join(' ').trim() || 'Der/die Mitarbeiter:in';
  const role = b.beschaeftigungAls?.trim();
  const branche = b.branche?.trim();
  const modules = b.moduleNames.length ? b.moduleNames.join(', ') : 'keine Module ausgewählt';
  const notw = b.notwendigkeit.length ? b.notwendigkeit.join(', ') : 'keine Angabe';
  const bez = b.bezug.length ? b.bezug.join(', ') : 'keine Angabe';
  const notwExtra = b.notwendigkeitFreitext?.trim();
  const bezExtra = b.bezugFreitext?.trim();
  const schul = b.schulbildung?.trim();

  const ausbildungenLines = (b.ausbildungen ?? [])
    .map((a) => {
      const parts = [
        a.vonBis?.trim(),
        a.ausbildungsstaette?.trim(),
        a.ausbildungAls?.trim(),
        a.abschluss === 'ja' ? 'mit Abschluss' : a.abschluss === 'nein' ? 'ohne Abschluss' : null,
      ].filter(Boolean);
      return parts.length ? `- ${parts.join(' | ')}` : null;
    })
    .filter((l): l is string => !!l);

  const werdegangLines = (b.werdegang ?? [])
    .map((w) => {
      const parts = [w.vonBis?.trim(), w.arbeitgeber?.trim(), w.taetigkeitAls?.trim()].filter(Boolean);
      return parts.length ? `- ${parts.join(' | ')}` : null;
    })
    .filter((l): l is string => !!l);

  return [
    `Mitarbeiter:in: ${name}${role ? `, ${role}` : ''}`,
    branche ? `Branche: ${branche}` : null,
    `Vertical: ${b.vertical}`,
    `Geplante Module: ${modules}`,
    `Notwendigkeitsgründe: ${notw}`,
    notwExtra ? `Zusätzliche Notwendigkeit (Freitext): ${notwExtra}` : null,
    `Bezug zur Person: ${bez}`,
    bezExtra ? `Zusätzlicher Bezug (Freitext): ${bezExtra}` : null,
    schul ? `Höchster Schulabschluss: ${schul}` : null,
    ausbildungenLines.length ? `Ausbildungen:\n${ausbildungenLines.join('\n')}` : null,
    werdegangLines.length ? `Beruflicher Werdegang (letzte Jahre):\n${werdegangLines.join('\n')}` : null,
    '',
    'Schreibe die Begründung der Fördernotwendigkeit. Die Freitext-Angaben sind wichtige zusätzliche Punkte und sollen sinngemäß in den Absatz integriert werden. Werdegang/Ausbildung sind Kontext zur Untermauerung des "Bezugs zur Person" — nicht aufzählen, höchstens eine konkrete Station referenzieren, wenn sie den Bezug stützt.',
  ].filter(Boolean).join('\n');
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: 'API-Key nicht konfiguriert.' }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Ungültiger Body.' }, { status: 400 });
  }

  if (!body.vertical || !Array.isArray(body.moduleNames)) {
    return NextResponse.json({ ok: false, error: 'Vertical und Module erforderlich.' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: buildUserPrompt(body) }],
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.Messages.TextBlock => b.type === 'text',
    );
    if (!textBlock) {
      return NextResponse.json({ ok: false, error: 'Keine Antwort vom Modell.' }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      begruendung: textBlock.text.trim(),
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cache_read: response.usage.cache_read_input_tokens ?? 0,
      },
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ ok: false, error: 'Rate Limit — kurz warten.' }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ ok: false, error: `API-Fehler: ${err.message}` }, { status: 502 });
    }
    console.error('generate-begruendung error:', err);
    return NextResponse.json({ ok: false, error: 'Unerwarteter Fehler.' }, { status: 500 });
  }
}
