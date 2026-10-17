/**
 * Iterative radix-2 Cooley-Tukey FFT.
 *
 * Only the power spectrum is ever needed here, so this works in place on
 * separate real and imaginary arrays and avoids allocating complex objects
 * per bin — this runs on every 25ms frame of every attempt, on a phone.
 */

/** Bit-reversal permutation, precomputed per size since frame size is fixed. */
function reversalTable(size: number): Uint32Array {
  const table = new Uint32Array(size);
  const bits = Math.log2(size);
  for (let i = 0; i < size; i++) {
    let reversed = 0;
    for (let bit = 0; bit < bits; bit++) {
      reversed = (reversed << 1) | ((i >>> bit) & 1);
    }
    table[i] = reversed;
  }
  return table;
}

const TABLES = new Map<number, Uint32Array>();

/**
 * In-place FFT. `size` must be a power of two.
 */
export function fft(real: Float32Array, imag: Float32Array): void {
  const size = real.length;
  if ((size & (size - 1)) !== 0) {
    throw new Error(`FFT size must be a power of two, got ${size}`);
  }

  let table = TABLES.get(size);
  if (!table) {
    table = reversalTable(size);
    TABLES.set(size, table);
  }

  for (let i = 0; i < size; i++) {
    const j = table[i];
    if (j > i) {
      let swap = real[i];
      real[i] = real[j];
      real[j] = swap;
      swap = imag[i];
      imag[i] = imag[j];
      imag[j] = swap;
    }
  }

  for (let span = 2; span <= size; span <<= 1) {
    const half = span >> 1;
    const step = (-2 * Math.PI) / span;
    for (let start = 0; start < size; start += span) {
      for (let k = 0; k < half; k++) {
        const angle = step * k;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const i = start + k;
        const j = i + half;
        const tre = real[j] * cos - imag[j] * sin;
        const tim = real[j] * sin + imag[j] * cos;
        real[j] = real[i] - tre;
        imag[j] = imag[i] - tim;
        real[i] += tre;
        imag[i] += tim;
      }
    }
  }
}

/** Power spectrum for bins 0..size/2, reusing a caller-supplied buffer. */
export function powerSpectrum(
  frame: Float32Array,
  real: Float32Array,
  imag: Float32Array,
  out: Float32Array,
): void {
  real.set(frame);
  imag.fill(0);
  fft(real, imag);
  for (let i = 0; i < out.length; i++) {
    out[i] = real[i] * real[i] + imag[i] * imag[i];
  }
}
