/**
 * Pauri and line audio ranges.
 *
 * The ustaad recordings are one long track per bani per reciter, not one file
 * per pauri. What makes them usable pauri by pauri is a companion timing file
 * giving the start and end of every line, in the same order BaniDB returns
 * them. A pauri's range is then simply its first line's start to its last
 * line's end.
 *
 * Timings are bundled rather than fetched: the audio manifest API returns an
 * empty `lyrics_url` for every Jaap Sahib track, so the network is not a
 * source for them. Metro inlines these JSON files at build time.
 */

import type { PaathLine, Paath } from '../api/bani';
import type { Pauri } from '../api/pauris';

import bhaiJarnailSingh from './timings/BhaiJarnailSingh/JaapSahib.json';
import gianiGurdevSingh from './timings/GianiGurdevSingh/JaapSahib.json';
import indermohanKaur from './timings/IndermohanKaurUK/JaapSahib.json';

/** Azure Front Door CDN holding the recordings. Supports range requests. */
export const AUDIO_BASE_URL =
  'https://gurbani-audios-c4abhzghhnccd5gj.z01.azurefd.net/audios';

/** A start/end pair in seconds, relative to the start of the track. */
export interface AudioRange {
  start: number;
  end: number;
}

/** One line's position in a recording. `sequence` is 1-based. */
export interface LineTiming extends AudioRange {
  sequence: number;
}

export interface Reciter {
  id: number;
  name: string;
  /** The exact recording these timings were measured against. */
  trackUrl: string;
  /** Track length in seconds, used to sanity-check the timings on load. */
  trackLengthSeconds: number;
  raw: RawTiming[];
}

interface RawTiming {
  start: number;
  end: number;
  text: string;
}

/**
 * Jaap Sahib reciters. The track URL and length come from the kids-mode
 * bundled manifest, and each pairs with the timing file beside it — the live
 * manifest API lists a different, longer recording under a similar name, whose
 * timings these are NOT.
 */
export const JAAP_SAHIB_RECITERS: Reciter[] = [
  {
    id: 4,
    name: 'Bhai Jarnail Singh',
    trackUrl: `${AUDIO_BASE_URL}/BhaiJarnailSingh/JaapSahib.m4a`,
    trackLengthSeconds: 987,
    raw: bhaiJarnailSingh as RawTiming[],
  },
  {
    id: 8,
    name: 'Bibi Indermohan Kaur',
    trackUrl: `${AUDIO_BASE_URL}/IndermohanKaurUK/JaapSahib.m4a`,
    trackLengthSeconds: 1170,
    raw: indermohanKaur as RawTiming[],
  },
  {
    id: 9,
    name: 'Giani Gurdev Singh',
    trackUrl: `${AUDIO_BASE_URL}/GianiGurdevSingh/JaapSahib.m4a`,
    trackLengthSeconds: 1281,
    raw: gianiGurdevSingh as RawTiming[],
  },
];

/** BaniDB's id for Jaap Sahib — the only bani with bundled timings so far. */
export const JAAP_SAHIB_BANI_ID = 4;

export class TimingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimingError';
  }
}

export interface ParsedTimings {
  timings: LineTiming[];
  /** Line numbers whose timings were corrected on load. */
  repaired: number[];
}

/** Above this share of repaired lines, assume the file is wrong, not typo'd. */
const MAX_REPAIR_RATIO = 0.01;

/** Entries chain when each line's end is the next line's start. */
const CHAIN_EPSILON = 1e-6;

/**
 * Parse a reciter's raw timing entries.
 *
 * `text` carries the 1-based line number, and in at least one file every value
 * has trailing tabs — hence the trim. A non-numeric or out-of-order line
 * number means the file cannot be trusted to line up with the paath, so those
 * throw rather than returning something subtly wrong.
 *
 * A backwards entry is different: it is a typo, not the wrong file. The
 * entries chain — every line's end is the next line's start — so a line whose
 * end precedes its start means two adjacent boundaries were transposed, and
 * the fix is to put them back in order. Bhai Jarnail Singh's Jaap Sahib line
 * 373 reads 481.335 → 480.951 between neighbours that chain cleanly; swapping
 * the boundary restores 480.951 → 481.335 and leaves its neighbours ordered.
 * Swapping only that one entry's own start and end would instead overlap line
 * 372, which would feed a neighbouring line's audio into the scorer.
 *
 * If a meaningful share of lines need repairing, the file really is wrong and
 * this throws instead.
 */
export function parseLineTimings(raw: RawTiming[]): ParsedTimings {
  const repaired: number[] = [];

  const timings: LineTiming[] = raw.map((entry, index) => {
    const sequence = Number(String(entry.text).trim());
    if (!Number.isInteger(sequence)) {
      throw new TimingError(
        `Timing entry ${index} has a non-numeric line number: "${entry.text}"`,
      );
    }
    return { sequence, start: entry.start, end: entry.end };
  });

  timings.forEach((timing, index) => {
    if (timing.sequence !== index + 1) {
      throw new TimingError(
        `Timings are not in line order: entry ${index} claims line ${timing.sequence}`,
      );
    }
  });

  timings.forEach((timing, index) => {
    if (timing.end > timing.start) return;

    const previous = timings[index - 1];
    const next = timings[index + 1];
    const chained =
      previous !== undefined &&
      next !== undefined &&
      Math.abs(previous.end - timing.start) < CHAIN_EPSILON &&
      Math.abs(next.start - timing.end) < CHAIN_EPSILON;

    if (chained) {
      // Transposed boundary: move it back, carrying the neighbours with it.
      const low = timing.end;
      const high = timing.start;
      previous.end = low;
      timing.start = low;
      timing.end = high;
      next.start = high;
    } else {
      // No chain to lean on; the best we can do is order the pair itself.
      const low = Math.min(timing.start, timing.end);
      const high = Math.max(timing.start, timing.end);
      timing.start = low;
      timing.end = high;
    }

    if (timing.end <= timing.start) {
      throw new TimingError(
        `Timing entry ${index} (line ${timing.sequence}) has zero duration`,
      );
    }
    repaired.push(timing.sequence);
  });

  // Allow a single typo in even a short file, but not systemic damage.
  if (repaired.length > Math.max(1, raw.length * MAX_REPAIR_RATIO)) {
    throw new TimingError(
      `${repaired.length} of ${raw.length} timings are backwards — this file does not look usable`,
    );
  }

  return { timings, repaired };
}

/**
 * Ranges for a paath, resolved against one reciter's recording.
 *
 * Keyed by line identity rather than verse id — `groupIntoPauris` hands back
 * the very same line objects, so identity is exact and never depends on verse
 * ids being unique within a bani.
 */
export interface AudioIndex {
  reciter: Reciter;
  trackUrl: string;
  byLine: Map<PaathLine, AudioRange>;
  /** Line numbers whose timings were repaired on load; empty when clean. */
  repaired: number[];
}

/**
 * Pair a paath with a reciter's timings.
 *
 * Throws when the two don't describe the same recitation — a mismatch here
 * would otherwise surface as audio quietly drifting out of step with the text,
 * which is far harder to diagnose later.
 */
export function buildAudioIndex(paath: Paath, reciter: Reciter): AudioIndex {
  const { timings, repaired } = parseLineTimings(reciter.raw);

  if (timings.length !== paath.lines.length) {
    throw new TimingError(
      `${reciter.name}: ${timings.length} timings for ${paath.lines.length} lines of ${paath.titleTransliteration}`,
    );
  }

  const lastEnd = timings[timings.length - 1].end;
  // A few seconds of trailing silence is normal; a different recording is not.
  if (Math.abs(lastEnd - reciter.trackLengthSeconds) > 15) {
    throw new TimingError(
      `${reciter.name}: timings end at ${lastEnd.toFixed(0)}s but the track is ${reciter.trackLengthSeconds}s — these are probably different recordings`,
    );
  }

  const byLine = new Map<PaathLine, AudioRange>();
  paath.lines.forEach((line, index) => {
    byLine.set(line, { start: timings[index].start, end: timings[index].end });
  });

  return { reciter, trackUrl: reciter.trackUrl, byLine, repaired };
}

/** The range for a single line, or null if it isn't part of this index. */
export function lineAudioRange(
  index: AudioIndex,
  line: PaathLine,
): AudioRange | null {
  return index.byLine.get(line) ?? null;
}

/**
 * The range covering a whole pauri: its first line's start to its last line's
 * end. Null if any of its lines are missing from the index.
 */
export function pauriAudioRange(
  index: AudioIndex,
  pauri: Pauri,
): AudioRange | null {
  if (pauri.lines.length === 0) return null;

  const first = index.byLine.get(pauri.lines[0]);
  const last = index.byLine.get(pauri.lines[pauri.lines.length - 1]);
  if (!first || !last) return null;

  return { start: first.start, end: last.end };
}

/**
 * Reciters available for a bani, or an empty list when none are bundled.
 *
 * Only Jaap Sahib ships timings today, so every other bani degrades to a
 * silent (text-only) practice session rather than failing.
 */
export function recitersForBani(baniId: number): Reciter[] {
  return baniId === JAAP_SAHIB_BANI_ID ? JAAP_SAHIB_RECITERS : [];
}
