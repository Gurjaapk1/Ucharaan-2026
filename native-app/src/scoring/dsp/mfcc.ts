/**
 * MFCC features.
 *
 * These are what the child's recitation and the ustaad's are actually compared
 * on. Raw waveforms cannot be compared directly — the two differ in pitch,
 * loudness, microphone and room — so both sides are reduced to a sequence of
 * short-time spectral envelopes, which track *how a sound is formed* far more
 * than who formed it.
 */

import { powerSpectrum } from './fft';

export interface MfccOptions {
  sampleRate: number;
  /** Analysis window in ms. 25 is the long-standing speech default. */
  frameMs: number;
  /** Hop between frames in ms. */
  hopMs: number;
  /** Number of mel filters. */
  filterCount: number;
  /** Cepstral coefficients kept per frame. */
  coefficients: number;
  /**
   * Vocal-tract-length warp applied to the filterbank.
   *
   * A child's vocal tract is shorter than an adult's, which shifts every
   * formant upward; comparing the two unwarped scores a correct recitation
   * about as badly as a wrong one. Scaling the filter frequencies undoes most
   * of that. 1 is no warp, which is how the reference features were built.
   */
  warp: number;
}

export const DEFAULT_MFCC: MfccOptions = {
  sampleRate: 16000,
  frameMs: 25,
  hopMs: 10,
  filterCount: 26,
  coefficients: 13,
  warp: 1,
};

export const PRE_EMPHASIS = 0.97;

export function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}

export function melToHz(mel: number): number {
  return 700 * (10 ** (mel / 2595) - 1);
}

/** Triangular mel filterbank as [startBin, weights] pairs. */
export function melFilterbank(
  filterCount: number,
  fftSize: number,
  sampleRate: number,
  warp = 1,
): { start: number; weights: Float32Array }[] {
  const bins = fftSize / 2 + 1;
  const low = hzToMel(0);
  const high = hzToMel(sampleRate / 2);
  const points: number[] = [];
  for (let i = 0; i < filterCount + 2; i++) {
    const mel = low + ((high - low) * i) / (filterCount + 1);
    // Warping stretches the frequency axis; clamp so filters stay under Nyquist.
    const hz = Math.min(sampleRate / 2, melToHz(mel) * warp);
    points.push(Math.floor(((fftSize + 1) * hz) / sampleRate));
  }

  const filters: { start: number; weights: Float32Array }[] = [];
  for (let f = 1; f <= filterCount; f++) {
    const left = points[f - 1];
    const centre = points[f];
    const right = Math.min(points[f + 1], bins - 1);
    const width = Math.max(1, right - left);
    const weights = new Float32Array(width);
    for (let i = 0; i < width; i++) {
      const bin = left + i;
      weights[i] =
        bin <= centre
          ? (bin - left) / Math.max(1, centre - left)
          : (right - bin) / Math.max(1, right - centre);
    }
    filters.push({ start: left, weights });
  }
  return filters;
}

/** Hamming window of the given length. */
export function hammingWindow(length: number): Float32Array {
  const window = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (length - 1));
  }
  return window;
}

/** DCT-II basis rows. */
export function dctBasis(coefficients: number, filterCount: number): Float32Array[] {
  const basis: Float32Array[] = [];
  for (let k = 0; k < coefficients; k++) {
    const row = new Float32Array(filterCount);
    for (let n = 0; n < filterCount; n++) {
      row[n] = Math.cos((Math.PI * k * (n + 0.5)) / filterCount);
    }
    basis.push(row);
  }
  return basis;
}

/** Next power of two at or above n. */
export function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size <<= 1;
  return size;
}

/**
 * Compute MFCC frames for a mono signal.
 *
 * Returns one Float32Array of `coefficients` values per frame; an empty array
 * when the signal is shorter than a single window.
 */
export function mfcc(
  samples: Float32Array,
  options: MfccOptions = DEFAULT_MFCC,
): Float32Array[] {
  const frameLength = Math.round((options.frameMs / 1000) * options.sampleRate);
  const hop = Math.round((options.hopMs / 1000) * options.sampleRate);
  if (samples.length < frameLength) return [];

  const fftSize = nextPowerOfTwo(frameLength);
  const spectrumBins = fftSize / 2 + 1;
  const filters = melFilterbank(
    options.filterCount,
    fftSize,
    options.sampleRate,
    options.warp,
  );

  const window = hammingWindow(frameLength);
  const dct = dctBasis(options.coefficients, options.filterCount);

  const frame = new Float32Array(fftSize);
  const real = new Float32Array(fftSize);
  const imag = new Float32Array(fftSize);
  const spectrum = new Float32Array(spectrumBins);
  const energies = new Float32Array(options.filterCount);
  const frames: Float32Array[] = [];

  for (let offset = 0; offset + frameLength <= samples.length; offset += hop) {
    frame.fill(0);
    // Pre-emphasis lifts the high frequencies that carry consonant detail.
    let previous = offset > 0 ? samples[offset - 1] : samples[offset];
    for (let i = 0; i < frameLength; i++) {
      const sample = samples[offset + i];
      frame[i] = (sample - PRE_EMPHASIS * previous) * window[i];
      previous = sample;
    }

    powerSpectrum(frame, real, imag, spectrum);

    for (let f = 0; f < filters.length; f++) {
      const { start, weights } = filters[f];
      let sum = 0;
      for (let i = 0; i < weights.length; i++) {
        const bin = start + i;
        if (bin < spectrumBins) sum += spectrum[bin] * weights[i];
      }
      // Floor before the log so silence cannot produce -Infinity.
      energies[f] = Math.log(Math.max(sum, 1e-10));
    }

    const coefficients = new Float32Array(options.coefficients);
    for (let k = 0; k < options.coefficients; k++) {
      const basis = dct[k];
      let sum = 0;
      for (let n = 0; n < options.filterCount; n++) sum += energies[n] * basis[n];
      coefficients[k] = sum;
    }
    frames.push(coefficients);
  }

  return frames;
}

/**
 * Cepstral mean and variance normalisation.
 *
 * Without this, a different microphone or room shifts every coefficient and
 * the same words score as different. This is what makes a child's phone
 * recording comparable to a studio recording of the ustaad.
 */
export function normalise(frames: Float32Array[]): Float32Array[] {
  if (frames.length === 0) return frames;
  const width = frames[0].length;
  const mean = new Float32Array(width);
  const deviation = new Float32Array(width);

  for (const frame of frames) {
    for (let i = 0; i < width; i++) mean[i] += frame[i];
  }
  for (let i = 0; i < width; i++) mean[i] /= frames.length;

  for (const frame of frames) {
    for (let i = 0; i < width; i++) {
      const delta = frame[i] - mean[i];
      deviation[i] += delta * delta;
    }
  }
  for (let i = 0; i < width; i++) {
    deviation[i] = Math.sqrt(deviation[i] / frames.length) || 1;
  }

  return frames.map(frame => {
    const out = new Float32Array(width);
    for (let i = 0; i < width; i++) out[i] = (frame[i] - mean[i]) / deviation[i];
    return out;
  });
}
