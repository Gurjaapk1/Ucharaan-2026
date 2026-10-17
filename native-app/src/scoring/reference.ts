/**
 * The ustaad's side of the comparison.
 *
 * Features are precomputed by scripts/extract-reference-features.mjs and
 * bundled, because the reference is a ~15MB AAC track and JavaScript has no
 * AAC decoder. Lines are decoded lazily — all 374 at once would be a needless
 * few megabytes of float arrays resident for a child practising one pauri.
 */

import type { Features } from './localScorer';
import bundled from './reference-japji.json';

interface BundledLine {
  pauri: number;
  line: number;
  frames: number;
  width: number;
  /** int8 features, base64 encoded, row-major by frame. */
  data: string;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Decode base64 to bytes.
 *
 * Hand-rolled rather than relying on `atob` or `Buffer`, neither of which is
 * guaranteed across Hermes versions — and a missing global here would only
 * show up on a device, long after this code looked fine.
 */
function fromBase64(input: string): Uint8Array {
  const clean = input.replace(/=+$/, '');
  const out = new Uint8Array((clean.length * 3) >> 2);
  let bits = 0;
  let accumulator = 0;
  let at = 0;

  for (let i = 0; i < clean.length; i++) {
    const value = CHARS.indexOf(clean[i]);
    if (value < 0) continue;
    accumulator = (accumulator << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[at++] = (accumulator >> bits) & 0xff;
    }
  }
  return out;
}

const index = new Map<string, BundledLine>();
for (const line of bundled.lines as BundledLine[]) {
  index.set(`${line.pauri}:${line.line}`, line);
}

const cache = new Map<string, Features>();

export const referenceReciter = bundled.reciter;
export const referenceTrack = bundled.track;

/** How many lines the bundle holds, for sanity checks and diagnostics. */
export const referenceLineCount = index.size;

/**
 * Features for one line, or null when the bundle has no entry — a missing
 * reference must read as "cannot score" rather than as a failed recitation.
 */
export function referenceFeatures(pauri: number, line: number): Features | null {
  const key = `${pauri}:${line}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const entry = index.get(key);
  if (!entry) return null;

  const bytes = fromBase64(entry.data);
  const signed = new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const frames: Features = [];
  for (let f = 0; f < entry.frames; f++) {
    const frame = new Float32Array(entry.width);
    for (let i = 0; i < entry.width; i++) {
      frame[i] = signed[f * entry.width + i] / bundled.scale;
    }
    frames.push(frame);
  }

  cache.set(key, frames);
  return frames;
}

/** Drop decoded features; call when leaving practice to reclaim memory. */
export function clearReferenceCache(): void {
  cache.clear();
}
