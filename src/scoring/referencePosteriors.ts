/**
 * The ustaad's posteriorgrams, precomputed by scripts/extract-posteriorgrams.py.
 *
 * Stored as uint8 because the values are sqrt-probabilities in [0,1], where a
 * byte is ample precision and a float array would be four times the size.
 */

import bundled from './reference-posteriors-japji.json';

interface BundledLine {
  pauri: number;
  line: number;
  frames: number;
  width: number;
  /** uint8 sqrt-probabilities, hex encoded, row-major by frame. */
  data: string;
}

const index = new Map<string, BundledLine>();
for (const line of bundled.lines as BundledLine[]) {
  index.set(`${line.pauri}:${line.line}`, line);
}

const cache = new Map<string, Float32Array[]>();

export const posteriorModel = bundled.model;
export const posteriorLineCount = index.size;

/** Posteriorgram for one line, or null when the bundle has no entry. */
export function referencePosteriors(
  pauri: number,
  line: number,
): Float32Array[] | null {
  const key = `${pauri}:${line}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const entry = index.get(key);
  if (!entry) return null;

  const frames: Float32Array[] = [];
  for (let f = 0; f < entry.frames; f++) {
    const frame = new Float32Array(entry.width);
    const base = (f * entry.width) * 2; // two hex characters per byte
    for (let i = 0; i < entry.width; i++) {
      const at = base + i * 2;
      frame[i] = parseInt(entry.data.slice(at, at + 2), 16) / 255;
    }
    frames.push(frame);
  }

  cache.set(key, frames);
  return frames;
}

export function clearPosteriorCache(): void {
  cache.clear();
}
