/**
 * Sample-rate conversion for the live stream.
 *
 * The reference features were computed at 16 kHz. Audio hardware frequently
 * ignores a requested rate — browsers commonly insist on 44.1 or 48 kHz — and
 * feeding 48 kHz audio to a 16 kHz feature extractor does not merely sound
 * wrong, it shifts every mel band and makes the comparison meaningless.
 *
 * Windowed-sinc interpolation is used rather than dropping samples: naive
 * decimation aliases everything above the new Nyquist back down into the
 * speech band, which is exactly where the comparison lives.
 */

/** Half-width of the interpolation kernel. 16 keeps the stopband respectable. */
const HALF_TAPS = 16;

function sinc(x: number): number {
  if (x === 0) return 1;
  const pix = Math.PI * x;
  return Math.sin(pix) / pix;
}

export class Resampler {
  private readonly ratio: number;
  private readonly cutoff: number;
  /** Tail of the previous buffer, so the kernel spans buffer boundaries. */
  private history: Float32Array;
  /** Fractional read position within `history` + incoming samples. */
  private position = 0;

  private readonly inputRate: number;
  private readonly outputRate: number;

  constructor(inputRate: number, outputRate: number) {
    this.inputRate = inputRate;
    this.outputRate = outputRate;
    this.ratio = inputRate / outputRate;
    // Cut off just below the lower of the two Nyquist limits.
    this.cutoff = Math.min(1, outputRate / inputRate) * 0.9;
    this.history = new Float32Array(0);
  }

  get passthrough(): boolean {
    return this.inputRate === this.outputRate;
  }

  /** Resample one buffer, carrying state across calls. */
  push(samples: Float32Array): Float32Array {
    if (this.passthrough) return samples;

    const buffer = new Float32Array(this.history.length + samples.length);
    buffer.set(this.history);
    buffer.set(samples, this.history.length);

    const out: number[] = [];
    let at = this.position;

    // Stop far enough from the end that the kernel stays inside the buffer.
    while (at + HALF_TAPS < buffer.length) {
      const centre = Math.floor(at);
      const fraction = at - centre;
      let sum = 0;
      let weight = 0;

      for (let k = -HALF_TAPS; k <= HALF_TAPS; k++) {
        const index = centre + k;
        if (index < 0 || index >= buffer.length) continue;
        const x = k - fraction;
        // Hann-windowed sinc.
        const window =
          0.5 + 0.5 * Math.cos((Math.PI * x) / (HALF_TAPS + 1));
        const tap = this.cutoff * sinc(this.cutoff * x) * window;
        sum += buffer[index] * tap;
        weight += tap;
      }

      out.push(weight > 0 ? sum / weight : 0);
      at += this.ratio;
    }

    // Keep the samples the next kernel will reach back into.
    const consumed = Math.max(0, Math.floor(at) - HALF_TAPS);
    this.history = buffer.slice(consumed);
    this.position = at - consumed;

    return Float32Array.from(out);
  }

  reset(): void {
    this.history = new Float32Array(0);
    this.position = 0;
  }
}
