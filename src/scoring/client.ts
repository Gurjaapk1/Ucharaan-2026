/**
 * Client for the team's pronunciation-scoring service.
 *
 * One recording, one request: the service aligns a complete recitation, so the
 * app records the whole pauri (or one line) and posts it when the child stops.
 */

import { Platform } from 'react-native';
import { File } from 'expo-file-system';

import {
  BANI,
  FIRST_PAURI_SEQ,
  REQUEST_TIMEOUT_MS,
  SCORING_API_KEY,
  SCORING_BASE_URL,
  SCORING_CONFIGURED,
  SCORING_DEBUG,
  SCORING_MOCK,
  SCORING_URL_PLACEHOLDER,
} from './config';
import { mockManifest, mockScore } from './mock';
import {
  ScoringError,
  type Manifest,
  type ScoreResponse,
  type ServiceScoreResponse,
} from './types';

/** BaniDB verse sequences for a pauri's lines, assuming bani.json splits lines as BaniDB does. */
export function seqsForPauri(
  pauris: { number: number; lines: unknown[] }[],
  pauriNumber: number,
): number[] {
  let first = FIRST_PAURI_SEQ;
  for (const p of pauris) {
    if (p.number === pauriNumber) {
      return p.lines.map((_, i) => first + i);
    }
    first += p.lines.length;
  }
  return [];
}

/** "5-10" when contiguous, "5,7" otherwise. */
export function formatSeqs(seqs: number[]): string {
  const contiguous = seqs.every((n, i) => i === 0 || n === seqs[i - 1] + 1);
  return contiguous && seqs.length > 1
    ? `${seqs[0]}-${seqs[seqs.length - 1]}`
    : seqs.join(',');
}

const MIME: Record<string, string> = {
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  webm: 'audio/webm',
  caf: 'audio/x-caf',
  '3gp': 'audio/3gpp',
};

async function appendAudio(form: FormData, fileUri: string): Promise<void> {
  if (Platform.OS === 'web') {
    // The web recorder hands back a blob: URL, which FormData cannot take by reference.
    const blob = await (await fetch(fileUri)).blob();
    const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
    form.append('audio', blob, `recitation.${ext}`);
    return;
  }

  const ext = (fileUri.split('?')[0].split('.').pop() ?? 'm4a').toLowerCase();
  const name = `recitation.${ext}`;
  const type = MIME[ext] ?? 'application/octet-stream';

  // The legacy React Native {uri, name, type} part is rejected here: Expo's
  // fetch serialises multipart itself and accepts only a string, a Blob, or an
  // object exposing bytes() — anything else throws "Unsupported FormDataPart
  // implementation" before a request is ever made.
  try {
    const file = new File(fileUri);
    log('audio part', {
      uri: fileUri,
      name,
      type,
      kind: 'expo-file',
      hasBytes: typeof (file as unknown as { bytes?: unknown }).bytes === 'function',
      size: (file as unknown as { size?: number }).size,
    });
    form.append('audio', file as unknown as Blob, name);
    return;
  } catch (caught) {
    log('expo File part rejected, falling back to bytes', {
      error: (caught as Error)?.message ?? String(caught),
    });
    // Older runtimes without a Blob-compatible File: send the bytes directly.
  }

  const bytes = await new File(fileUri).arrayBuffer();
  form.append('audio', new Blob([bytes], { type }), name);
}

/** Console tracing for the scoring path; quiet unless SCORING_DEBUG is on. */
function log(message: string, detail?: unknown): void {
  if (!SCORING_DEBUG) return;
  if (detail === undefined) console.log(`[scoring] ${message}`);
  else console.log(`[scoring] ${message}`, detail);
}

if (SCORING_DEBUG) {
  log('config', {
    baseUrl: SCORING_BASE_URL,
    configured: SCORING_CONFIGURED,
    apiKey: SCORING_API_KEY ? 'set' : 'absent',
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
  if (!SCORING_CONFIGURED) {
    console.warn(
      `[scoring] EXPO_PUBLIC_SCORING_URL is not set, so requests go to ${SCORING_URL_PLACEHOLDER} ` +
        'and will always fail. Set it in .env and restart the dev server ' +
        '(Expo inlines these at bundle time).',
    );
  }
}

async function request(path: string, init: RequestInit): Promise<Response> {
  // Fail with the real reason rather than a network error nobody can action.
  if (!SCORING_CONFIGURED) {
    throw new ScoringError(
      'The checking service is not configured yet (EXPO_PUBLIC_SCORING_URL is unset).',
    );
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (SCORING_API_KEY) headers['X-Api-Key'] = SCORING_API_KEY;

  // The spec's hosting note: a cold replica can be slow, so one timed-out attempt is retried.
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const url = `${SCORING_BASE_URL}${path}`;
    const startedAt = Date.now();
    log(`request attempt ${attempt + 1}`, { url, method: init.method ?? 'GET' });
    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });
      log('response', {
        url,
        status: response.status,
        ok: response.ok,
        ms: Date.now() - startedAt,
      });
      return response;
    } catch (caught) {
      log(`attempt ${attempt + 1} failed`, {
        url,
        ms: Date.now() - startedAt,
        aborted: controller.signal.aborted,
        error: (caught as Error)?.message ?? String(caught),
      });
      if (attempt >= 1) {
        throw new ScoringError(
          controller.signal.aborted
            ? 'The checking service took too long. Please try again.'
            : 'Could not reach the checking service. Check the connection and try again.',
        );
      }
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Accepts 0-1 as the contract states, or an already-scaled percent. */
function percent(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(100, value <= 1 ? value * 100 : value)));
}

/** Map the wire response onto the app's result shape; line indexes follow `seqs`. */
export function toScoreResponse(
  body: ServiceScoreResponse,
  seqs: number[],
): ScoreResponse {
  const lineOf = new Map(seqs.map((seq, i) => [seq, i]));
  if (body.status === 'unclear') {
    return { status: 'unclear', lineScores: [], words: [], provider: 'service', focus: null };
  }

  const lineScores = seqs.map(() => 0);
  const words: ScoreResponse['words'] = [];
  for (const line of body.lines ?? []) {
    const lineIndex = lineOf.get(Number(line.seq));
    if (lineIndex === undefined) continue;
    lineScores[lineIndex] = percent(line.share_like ?? line.share_like_reciter);
    for (const w of line.words ?? []) {
      words.push({ lineIndex, wordIndex: w.idx, state: w.state, reasons: w.reasons ?? [] });
    }
  }

  const focusLine = body.focus ? lineOf.get(Number(body.focus.seq)) : undefined;
  return {
    status: 'ok',
    lineScores,
    words,
    provider: 'service',
    focus:
      body.focus && focusLine !== undefined
        ? { lineIndex: focusLine, wordIndex: body.focus.idx }
        : null,
  };
}

/** Absolute URL for a manifest path such as `ggs/5/words/0.wav`. */
export function referenceUrl(path: string): string {
  return `${SCORING_BASE_URL}/reference/${path}`;
}

let manifestCache: Promise<Manifest> | null = null;

/** The reciters, word clips and star bands; fetched once per app session. */
export function fetchManifest(): Promise<Manifest> {
  if (SCORING_MOCK) return Promise.resolve(mockManifest());
  manifestCache ??= request(`/v1/manifest?bani=${BANI}`, { method: 'GET' })
    .then(async response => {
      if (!response.ok) throw new ScoringError(`Manifest unavailable (${response.status})`, response.status);
      return (await response.json()) as Manifest;
    })
    .catch(caught => {
      // A failed fetch is retried next time rather than cached.
      manifestCache = null;
      throw caught;
    });
  return manifestCache;
}

/** Send one recording for scoring against the chosen reciter. */
export async function scoreRecording(
  fileUri: string,
  opts: { bani: number; reciter: string; seqs: number[] },
): Promise<ScoreResponse> {
  if (SCORING_MOCK) {
    // Long enough to see the "Checking…" state.
    await new Promise(resolve => setTimeout(resolve, 1500));
    return toScoreResponse(mockScore(opts.seqs), opts.seqs);
  }
  const form = new FormData();
  form.append('bani', String(opts.bani));
  form.append('reciter', opts.reciter);
  form.append('seqs', formatSeqs(opts.seqs));
  await appendAudio(form, fileUri);

  const response = await request('/v1/score', { method: 'POST', body: form });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new ScoringError(
      response.status === 401 || response.status === 403
        ? 'The checking service did not accept this app’s key.'
        : `The checking service could not score this (${response.status}).${detail ? ` ${detail.slice(0, 120)}` : ''}`,
      response.status,
    );
  }
  return toScoreResponse((await response.json()) as ServiceScoreResponse, opts.seqs);
}
