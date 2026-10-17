/**
 * On-device scoring.
 *
 * The child's recording never leaves the phone. It is compared directly
 * against the ustaad's recording of the same line — MFCC features, aligned
 * with DTW — which is the project's stated principle: the ustaad sets the
 * standard, and the scorer only measures against it. No transcription, no
 * language model, no network.
 */

import { dtw } from './dsp/dtw';
import { DEFAULT_MFCC, mfcc, normalise, type MfccOptions } from './dsp/mfcc';
import { decodeWav, slice, type Pcm } from './dsp/wav';

/**
 * Cost at which a line scores zero.
 *
 * Measured against the reference recording itself: the same line re-aligned
 * costs ~0.013, a different line ~0.59. This sits near that upper figure so a
 * wholly wrong recitation floors out.
 *
 * It is NOT yet calibrated for a child against an ustaad — different speaker,
 * different microphone, different room all raise the floor. Treat the mapping
 * as provisional until it has been checked against an ustaad's own judgement
 * of real attempts, as the project README requires.
 */
export const ZERO_SCORE_COST = 0.6;

/** Features for one stretch of audio, ready to compare. */
export type Features = Float32Array[];

export function featuresFromSamples(
  samples: Float32Array,
  sampleRate: number,
  options: Partial<MfccOptions> = {},
): Features {
  return normalise(mfcc(samples, { ...DEFAULT_MFCC, sampleRate, ...options }));
}

/** Features for a slice of a decoded recording. */
export function featuresFromSlice(
  pcm: Pcm,
  startSeconds: number,
  endSeconds: number,
): Features {
  return featuresFromSamples(
    slice(pcm, startSeconds, endSeconds),
    pcm.sampleRate,
  );
}

export function featuresFromWav(buffer: ArrayBuffer): Features {
  const pcm = decodeWav(buffer);
  return featuresFromSamples(pcm.samples, pcm.sampleRate);
}

export interface LineScore {
  /** 0-100, matching WordFeedback.score in the UI. */
  score: number;
  /** Raw alignment cost, kept for calibration and debugging. */
  cost: number;
}

/**
 * Score one attempt against the reference for the same line.
 *
 * Returns a score of 0 with an infinite cost when either side has too little
 * audio to align — a silent attempt is not a good one, but the caller should
 * treat "no audio" as a prompt to try again rather than as a verdict.
 */
export function scoreLine(attempt: Features, reference: Features): LineScore {
  if (attempt.length === 0 || reference.length === 0) {
    return { score: 0, cost: Infinity };
  }

  const { normalisedCost } = dtw(attempt, reference);
  if (!Number.isFinite(normalisedCost)) return { score: 0, cost: Infinity };

  const ratio = Math.min(1, Math.max(0, normalisedCost / ZERO_SCORE_COST));
  return { score: Math.round((1 - ratio) * 100), cost: normalisedCost };
}

/**
 * Vocal-tract-length warps to try when scoring an attempt.
 *
 * The reference is an adult ustaad; a child's shorter vocal tract shifts every
 * formant upward, and comparing the two unwarped scores a correct recitation
 * about as poorly as a wrong one. Measured against the reference recording
 * pitch-shifted to stand in for another speaker, searching these warps lifts a
 * correct attempt from 45 to 90, and from 27 to 81 the other way, while a
 * genuinely wrong line stays at 24 — the gap the score depends on.
 */
export const WARP_FACTORS = [0.88, 0.92, 0.96, 1, 1.04, 1.08, 1.12, 1.16];

export interface WarpedScore extends LineScore {
  /** The warp that fitted best, usable as a starting point for later lines. */
  warp: number;
}

/**
 * Score raw audio against a reference, searching for the speaker's best warp.
 *
 * Takes samples rather than features because each warp needs its own
 * filterbank, so the features cannot be computed once up front.
 *
 * `preferred` is tried first and kept unless another warp beats it by
 * `WARP_MARGIN`; a child's vocal tract does not change between lines, so
 * holding the warp steady avoids it wobbling line to line on noisy audio.
 */
export function scoreSamplesWithWarpSearch(
  samples: Float32Array,
  sampleRate: number,
  reference: Features,
  preferred = 1,
): WarpedScore {
  if (samples.length === 0 || reference.length === 0) {
    return { score: 0, cost: Infinity, warp: preferred };
  }

  const order = [preferred, ...WARP_FACTORS.filter(w => w !== preferred)];
  let best: WarpedScore = { score: 0, cost: Infinity, warp: preferred };

  order.forEach((warp, index) => {
    const attempt = featuresFromSamples(samples, sampleRate, { warp });
    const result = scoreLine(attempt, reference);
    // The first entry is the preferred warp; later ones must clearly beat it.
    const margin = index === 0 ? 0 : WARP_MARGIN;
    if (result.cost + margin < best.cost) {
      best = { ...result, warp };
    }
  });

  return best;
}

/** How much better an alternative warp must be before switching to it. */
const WARP_MARGIN = 0.01;
