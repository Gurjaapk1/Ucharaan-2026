/**
 * BaniDB paath retrieval.
 *
 * Fetches a bani from the BaniDB API and flattens it into the shape the
 * Uchaaran Helper needs: one object per line, with words already split for
 * word-by-word follow-along and IPA kept for pronunciation scoring.
 *
 * No dependencies — React Native ships `fetch` and `AbortController`.
 */

import { useEffect, useState } from 'react';

/**
 * Which BaniDB server to talk to, read from `EXPO_PUBLIC_BANIDB_API_URL` in
 * `.env` (see `.env.example`). Nothing is hardcoded here, so pointing the app
 * at a local banidb-api or at the hosted one is a config change, not a code
 * change.
 *
 * Expo inlines `EXPO_PUBLIC_*` into the bundle at build time, so this is
 * configuration rather than a secret — fine for BaniDB, which needs no API
 * key. A real credential would have to stay server-side.
 *
 * `undefined` when unset; callers can still override per request via
 * `FetchBaniOptions.baseUrl`.
 */
export const BANIDB_BASE_URL: string | undefined =
  process.env.EXPO_PUBLIC_BANIDB_API_URL;

/**
 * Resolve the server for one request: an explicit `baseUrl` wins, then the
 * env var. Trailing slashes are trimmed so `${base}/banis/2` never doubles up.
 */
function resolveBaseUrl(baseUrl?: string): string {
  const resolved = (baseUrl ?? BANIDB_BASE_URL)?.trim();
  if (!resolved) {
    throw new BaniDbError(
      'No BaniDB server configured. Set EXPO_PUBLIC_BANIDB_API_URL in .env ' +
        '(copy .env.example) and restart Expo, or pass `baseUrl` explicitly.',
    );
  }
  return resolved.replace(/\/+$/, '');
}

/**
 * Bani IDs from GET /banis. `jpujI swihb` and `jwpu swihb` are different
 * banis — Japji Sahib opens Sri Guru Granth Sahib Ji, Jaap Sahib is Guru
 * Gobind Singh Ji's bani in Sri Dasam Granth.
 */
export const BANI_IDS = {
  GUR_MANTAR: 1,
  JAPJI_SAHIB: 2,
  JAAP_SAHIB: 4,
  CHAUPAI_SAHIB: 9,
  ANAND_SAHIB: 10,
  REHRAS_SAHIB: 21,
  SOHILA_SAHIB: 23,
  SUKHMANI_SAHIB: 31,
} as const;

/**
 * Which rehat's line set to keep. Banis like Rehras Sahib differ between
 * maryadas (530 lines in total, 309 of them SGPC), so this is a real filter.
 * Japji Sahib and Jaap Sahib are identical across all four.
 */
export type Rehat = 'sgpc' | 'taksal' | 'buddhadal' | 'medium' | 'all';

/** One line of paath, flattened for the player and the scorer. */
export interface PaathLine {
  verseId: number;
  /** Line number on its ang. */
  lineNo: number;
  /** Ang (page) this line sits on. */
  pageNo: number;
  /** Pauri / stanza grouping, from the API's `paragraph`. */
  paragraph: number | null;
  /**
   * The API's `header` marker: 1 for the opening mangal (in Japji Sahib this
   * is the Mool Mantar itself), 2 for a section heading such as ॥ ਜਪੁ ॥ or
   * ਸਲੋਕੁ ॥, null for an ordinary line. All of these are recited — treat this
   * as a styling hint, never as a filter for what to leave out.
   */
  headingLevel: number | null;
  /** Padh chhedh Gurmukhi (word-separated) — what a child reads. */
  gurmukhi: string;
  /** Larivaar Gurmukhi (no word breaks). */
  larivaar: string;
  /** `gurmukhi` split on whitespace — the tap targets for follow-along. */
  words: string[];
  /** Roman transliteration. */
  transliteration: string;
  /** IPA, for comparing against a child's recitation. */
  ipa: string;
  /** English translation (BaniDB's own). */
  translation: string;
}

export interface Paath {
  baniId: number;
  /** Gurmukhi title, e.g. ਜਪੁਜੀ ਸਾਹਿਬ */
  title: string;
  titleTransliteration: string;
  /** Sri Guru Granth Sahib Ji, Sri Dasam Granth Sahib, ... */
  source: string;
  writer: string;
  lines: PaathLine[];
}

export interface FetchBaniOptions {
  rehat?: Rehat;
  /** Overrides `EXPO_PUBLIC_BANIDB_API_URL` for this request. */
  baseUrl?: string;
  /** Milliseconds before the request is aborted. Default 15000. */
  timeoutMs?: number;
  /** Pass a screen's own signal to cancel on unmount or navigation. */
  signal?: AbortSignal;
}

/** Subset of the BaniDB response we actually read. */
interface ApiBaniResponse {
  baniInfo: {
    baniID: number;
    unicode: string;
    english: string;
    source?: { english?: string };
    writer?: { english?: string };
  };
  verses: ApiBaniVerse[];
}

interface ApiBaniVerse {
  header: number | null;
  paragraph: number | null;
  existsSGPC: number;
  existsTaksal: number;
  existsBuddhaDal: number;
  existsMedium: number;
  verse: {
    verseId: number;
    pageNo: number;
    lineNo: number;
    verse: { unicode: string; gurmukhi: string };
    larivaar: { unicode: string; gurmukhi: string };
    transliteration: { en?: string; english?: string; ipa?: string };
    translation: { en?: { bdb?: string; ssk?: string; ms?: string } };
  };
}

const REHAT_FLAGS: Record<Exclude<Rehat, 'all'>, keyof ApiBaniVerse> = {
  sgpc: 'existsSGPC',
  taksal: 'existsTaksal',
  buddhadal: 'existsBuddhaDal',
  medium: 'existsMedium',
};

export class BaniDbError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'BaniDbError';
    this.status = status;
  }
}

/**
 * Fetch a bani by ID and flatten it to lines.
 *
 * @example
 * const japji = await fetchBani(BANI_IDS.JAPJI_SAHIB, { rehat: 'sgpc' });
 */
export async function fetchBani(
  baniId: number,
  options: FetchBaniOptions = {},
): Promise<Paath> {
  const { rehat = 'all', baseUrl, timeoutMs = 15000, signal } = options;
  const server = resolveBaseUrl(baseUrl);

  if (signal?.aborted) {
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException('Aborted', 'AbortError');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Caller-driven cancellation (unmount, navigation) aborts this request too.
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  try {
    const response = await fetch(`${server}/banis/${baniId}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new BaniDbError(
        `BaniDB returned ${response.status} for bani ${baniId}`,
        response.status,
      );
    }

    const data: ApiBaniResponse = await response.json();
    if (!data?.verses?.length) {
      throw new BaniDbError(`No verses returned for bani ${baniId}`);
    }

    return normalizeBani(data, rehat);
  } catch (error) {
    if (error instanceof BaniDbError) throw error;
    if ((error as Error)?.name === 'AbortError') {
      // Distinguish our timeout from the caller cancelling deliberately.
      if (signal?.aborted) throw error;
      throw new BaniDbError(`Request for bani ${baniId} timed out`);
    }
    throw new BaniDbError(
      `Could not reach BaniDB: ${(error as Error)?.message ?? 'unknown error'}`,
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

/** Japji Sahib — the usual starting paath. */
export function fetchJapjiSahib(options?: FetchBaniOptions): Promise<Paath> {
  return fetchBani(BANI_IDS.JAPJI_SAHIB, options);
}

/** Jaap Sahib, from Sri Dasam Granth Sahib. */
export function fetchJaapSahib(options?: FetchBaniOptions): Promise<Paath> {
  return fetchBani(BANI_IDS.JAAP_SAHIB, options);
}

function normalizeBani(data: ApiBaniResponse, rehat: Rehat): Paath {
  const { baniInfo } = data;

  let verses = data.verses;
  if (rehat !== 'all') {
    const flag = REHAT_FLAGS[rehat];
    verses = verses.filter(verse => Boolean(verse[flag]));
  }
  return {
    baniId: baniInfo.baniID,
    title: baniInfo.unicode,
    titleTransliteration: baniInfo.english,
    source: baniInfo.source?.english ?? '',
    writer: baniInfo.writer?.english ?? '',
    lines: verses.map(toPaathLine),
  };
}

function toPaathLine(entry: ApiBaniVerse): PaathLine {
  const { verse } = entry;
  const gurmukhi = verse.verse.unicode;

  return {
    verseId: verse.verseId,
    lineNo: verse.lineNo,
    pageNo: verse.pageNo,
    paragraph: entry.paragraph,
    // The API sends 0 for ordinary lines; collapse it so a truthy test works.
    headingLevel: entry.header || null,
    gurmukhi,
    larivaar: verse.larivaar.unicode,
    words: gurmukhi.split(/\s+/).filter(Boolean),
    transliteration: verse.transliteration.en ?? verse.transliteration.english ?? '',
    ipa: verse.transliteration.ipa ?? '',
    translation: verse.translation.en?.bdb ?? verse.translation.en?.ssk ?? '',
  };
}

export interface UseBaniResult {
  paath: Paath | null;
  loading: boolean;
  error: Error | null;
  /** Re-run the request; useful behind a retry button. */
  reload: () => void;
}

/**
 * Hook wrapper. Cancels in flight requests on unmount and when `baniId` changes.
 *
 * @example
 * const { paath, loading, error } = useBani(BANI_IDS.JAPJI_SAHIB);
 */
export function useBani(
  baniId: number,
  options: Omit<FetchBaniOptions, 'signal'> = {},
): UseBaniResult {
  const [paath, setPaath] = useState<Paath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Options arrive as a fresh object each render, so depend on the fields
  // themselves and rebuild the object inside the effect.
  const { rehat, baseUrl, timeoutMs } = options;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    fetchBani(baniId, { rehat, baseUrl, timeoutMs, signal: controller.signal })
      .then(result => {
        if (active) {
          setPaath(result);
          setLoading(false);
        }
      })
      .catch((caught: Error) => {
        // An abort means we navigated away; nothing to report.
        if (active && caught.name !== 'AbortError') {
          setError(caught);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [baniId, rehat, baseUrl, timeoutMs, attempt]);

  return { paath, loading, error, reload: () => setAttempt(n => n + 1) };
}
