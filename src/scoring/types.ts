/**
 * The contract between the app and whatever scores a recitation.
 *
 * Deliberately provider-neutral: the app knows it sends a recording plus the
 * reference text and timings, and receives per-line and per-word scores. Which
 * speech model produces them is a server-side detail.
 *
 * Note on what can do this job: Claude and other text/vision LLMs cannot
 * accept audio, so the scorer is a speech system — ASR with forced alignment,
 * a pronunciation-assessment service, or an acoustic comparison against the
 * ustaad's own recording. An LLM is useful downstream, turning these numbers
 * into child-friendly coaching, not for the listening itself.
 */

/** One reference line: what should be said, and where it sits in the track. */
export interface ReferenceLine {
  text: string;
  /** Seconds into the ustaad recording. */
  start: number;
  end: number;
}

export interface ScoreRequest {
  pauriNumber: number;
  lines: ReferenceLine[];
  /** The child's recording. */
  audio: { uri: string; mimeType: string };
}

/** The service's per-word verdict; it never returns a fine-grained number. */
export type WordState = 'like' | 'check' | 'unclear';

/** A score for one word, located by its position in the reference text. */
export interface WordScore {
  lineIndex: number;
  wordIndex: number;
  /** 0-100, matching WordFeedback.score in the UI. Absent when only a state is known. */
  score?: number;
  state?: WordState;
  reasons?: string[];
}

export interface ScoreResponse {
  /** 0-100 per reference line, same order and length as the request. */
  lineScores: number[];
  words: WordScore[];
  /** Which provider produced this, for logging and calibration. */
  provider: string;
  /** 'unclear' means no score at all: no speech, too noisy, or alignment too weak. */
  status?: 'ok' | 'unclear';
  /** The word most worth practising, if any. */
  focus?: { lineIndex: number; wordIndex: number } | null;
}

/** Wire shape of `POST /v1/score`. */
export interface ServiceScoreResponse {
  status: 'ok' | 'unclear';
  lines: {
    seq: number;
    /** Duration-weighted share of `like` words, 0-1. */
    share_like?: number;
    /** Name used in the spec's example; accepted until the service settles on one. */
    share_like_reciter?: number;
    words: { idx: number; state: WordState; reasons?: string[] }[];
  }[];
  focus: { seq: number; idx: number } | null;
}

export class ScoringError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ScoringError';
    this.status = status;
  }
}

/** Wire shape of `GET /v1/manifest`; URLs are relative to `{BASE}/reference/`. */
export interface Manifest {
  bani: number;
  reciters: string[];
  /** reciter -> seq (a string key in JSON) -> line. */
  lines: Record<string, Record<string, {
    pankti_url: string;
    words: {
      idx: number;
      gurmukhi: string;
      roman: string;
      start_s: number;
      end_s: number;
      clip_url: string;
      rule: string | null;
    }[];
  }>>;
  /** Percent of `like` needed for 1, 2 and 3 stars. */
  star_bands: number[];
}
