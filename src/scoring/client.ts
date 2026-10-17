/**
 * Client for the team's pronunciation-scoring service.
 *
 * One recording, one request: the service aligns a complete recitation, so the
 * app records the whole pauri (or one line) and posts it when the child stops.
 */

import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

import {
  BANI,
  FIRST_PAURI_SEQ,
  REQUEST_TIMEOUT_MS,
  SCORING_API_KEY,
  SCORING_BASE_URL,
  SCORING_MOCK,
} from './config';
import { mockFollow, mockManifest, mockScore } from './mock';
import {
  ScoringError,
  type Manifest,
  type ScoreResponse,
  type ServiceFollowResponse,
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
  // React Native's FormData uploads a file given {uri, name, type}; DOM typings do not know it.
  form.append('audio', {
    uri: fileUri,
    name: `recitation.${ext}`,
    type: MIME[ext] ?? 'application/octet-stream',
  } as unknown as Blob);
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (SCORING_API_KEY) headers['X-Api-Key'] = SCORING_API_KEY;
  return headers;
}

async function request(path: string, init: RequestInit): Promise<Response> {
  const headers = authHeaders();

  // The spec's hosting note: a cold replica can be slow, so one timed-out attempt is retried.
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(`${SCORING_BASE_URL}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
    } catch (caught) {
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

/** The pauri's percent: the mean of its line percents, 0 when no line was scored. */
export function pauriScore(lineScores: number[]): number {
  return lineScores.length
    ? Math.round(lineScores.reduce((n, s) => n + s, 0) / lineScores.length)
    : 0;
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

/** A follow that takes longer than this is dropped; the next tick sends more audio anyway. */
const FOLLOW_TIMEOUT_MS = 8000;

/**
 * Send the recording so far (a 16 kHz mono WAV) and get each word's state.
 *
 * Best effort and never retried: the caller polls every few seconds, so a slow
 * or failed answer is simply replaced by the next one. Returns null when the
 * service did not answer usefully; throws only for a 404/405 (endpoint absent).
 */
export async function followRecording(
  wav: Uint8Array,
  opts: { bani: number; reciter: string; seqs: number[]; signal?: AbortSignal },
): Promise<ServiceFollowResponse | null> {
  if (SCORING_MOCK) {
    // 44-byte header, 2 bytes a sample at 16 kHz.
    return mockFollow(opts.seqs, (wav.length - 44) / 32000);
  }
  const form = new FormData();
  form.append('bani', String(opts.bani));
  form.append('reciter', opts.reciter);
  form.append('seqs', formatSeqs(opts.seqs));
  if (Platform.OS === 'web') {
    form.append('audio', new Blob([wav as BlobPart], { type: 'audio/wav' }), 'follow.wav');
  } else {
    // React Native's FormData cannot take bytes, only a file reference.
    const file = new File(Paths.cache, 'follow.wav');
    if (!file.exists) file.create();
    await file.write(wav);
    form.append('audio', { uri: file.uri, name: 'follow.wav', type: 'audio/wav' } as unknown as Blob);
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  opts.signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, FOLLOW_TIMEOUT_MS);
  try {
    const response = await fetch(`${SCORING_BASE_URL}/v1/follow`, {
      method: 'POST',
      body: form,
      headers: authHeaders(),
      signal: controller.signal,
    });
    if (response.status === 404 || response.status === 405) {
      throw new ScoringError('Live following is not available on this service.', response.status);
    }
    return response.ok ? ((await response.json()) as ServiceFollowResponse) : null;
  } catch (caught) {
    if (caught instanceof ScoringError) throw caught;
    return null;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', abort);
  }
}
