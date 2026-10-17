/**
 * IndicConformer posteriorgrams.
 *
 * Instead of comparing raw spectral shape (MFCCs), this asks a Punjabi speech
 * model what sounds it hears, and compares those. The model's per-frame token
 * probabilities are far less sensitive to who is speaking than cepstra are,
 * which is the weakness that made a correct recitation in a child's voice
 * score about as badly as a wrong one.
 *
 * The model runs locally in the browser via onnxruntime-web; audio is never
 * uploaded. The reference side is precomputed by
 * scripts/extract-posteriorgrams.py, because running the model over the whole
 * 16-minute recording on each session is not viable.
 */

/**
 * ONNX Runtime is loaded at runtime from a <script> tag rather than imported.
 *
 * Every onnxruntime-web build contains a dynamic import carrying webpack and
 * vite pragmas, which Metro refuses to transform ("Invalid call ... import").
 * Serving the UMD build ourselves sidesteps the bundler entirely and keeps the
 * app working offline, which a CDN would not.
 */
type OrtTensor = { dims: readonly number[]; data: unknown };
type OrtSession = {
  run(feeds: Record<string, unknown>): Promise<Record<string, OrtTensor>>;
};
type OrtGlobal = {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  Tensor: new (type: string, data: unknown, dims: number[]) => unknown;
  InferenceSession: {
    create(path: string, options?: Record<string, unknown>): Promise<OrtSession>;
  };
};

/** The model was trained at this rate and the reference was built at it. */
export const CONFORMER_SAMPLE_RATE = 16000;

/** NeMo preprocessing constants the exported graph expects. */
const N_FFT = 512;
const WIN = 400;
const HOP = 160;
const N_MELS = 80;
const PRE_EMPHASIS = 0.97;
const LOG_GUARD = 2 ** -24;

/** CTC blank. It dominates every frame and carries no phonetic information. */
const BLANK_INDEX = 256;

/** Where the quantised model is served from. */
const MODEL_URL = '/models/punjabi.int8.onnx';

/** Self-hosted ONNX Runtime, so there is no CDN dependency. */
const ORT_SCRIPT = '/ort/ort.min.js';
const ORT_WASM_DIR = '/ort/';

let ortPromise: Promise<OrtGlobal> | null = null;

/** Load ONNX Runtime once, via a script tag. */
function loadOrt(): Promise<OrtGlobal> {
  if (ortPromise) return ortPromise;

  ortPromise = new Promise<OrtGlobal>((resolve, reject) => {
    const existing = (globalThis as { ort?: OrtGlobal }).ort;
    if (existing) return resolve(existing);

    if (typeof document === 'undefined') {
      return reject(new Error('ONNX Runtime needs a browser environment'));
    }

    const script = document.createElement('script');
    script.src = ORT_SCRIPT;
    script.async = true;
    script.onload = () => {
      const loaded = (globalThis as { ort?: OrtGlobal }).ort;
      if (!loaded) return reject(new Error('ONNX Runtime did not register'));
      loaded.env.wasm.wasmPaths = ORT_WASM_DIR;
      // Threads need cross-origin isolation headers the dev server does not
      // send; single-threaded still runs a line in well under a second.
      loaded.env.wasm.numThreads = 1;
      resolve(loaded);
    };
    script.onerror = () => reject(new Error(`Could not load ${ORT_SCRIPT}`));
    document.head.appendChild(script);
  });

  return ortPromise;
}

function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}
function melToHz(mel: number): number {
  return 700 * (10 ** (mel / 2595) - 1);
}

/** Mel filterbank matching the NeMo preprocessor, built once. */
function buildFilterbank(): Float32Array[] {
  const bins = N_FFT / 2 + 1;
  const points: number[] = [];
  for (let i = 0; i < N_MELS + 2; i++) {
    const mel = (hzToMel(CONFORMER_SAMPLE_RATE / 2) * i) / (N_MELS + 1);
    points.push(
      Math.floor(((N_FFT + 1) * melToHz(mel)) / CONFORMER_SAMPLE_RATE),
    );
  }
  const filters: Float32Array[] = [];
  for (let i = 0; i < N_MELS; i++) {
    const row = new Float32Array(bins);
    const left = points[i];
    const centre = points[i + 1];
    const right = Math.min(points[i + 2], bins - 1);
    for (let k = left; k < centre; k++) row[k] = (k - left) / Math.max(1, centre - left);
    for (let k = centre; k < right; k++) row[k] = (right - k) / Math.max(1, right - centre);
    filters.push(row);
  }
  return filters;
}

const FILTERBANK = buildFilterbank();

const HANN = (() => {
  const w = new Float32Array(WIN);
  for (let i = 0; i < WIN; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (WIN - 1));
  return w;
})();

/** Naive DFT magnitude is far too slow here; reuse the project's FFT. */
import { powerSpectrum } from './dsp/fft';

/**
 * Log-mel features in the shape the model expects: [mels][frames], with
 * per-feature mean/variance normalisation across time.
 */
export function logMel(samples: Float32Array): { data: Float32Array; frames: number } {
  const frames = Math.max(0, 1 + Math.floor((samples.length - WIN) / HOP));
  if (frames < 1) return { data: new Float32Array(0), frames: 0 };

  const padded = new Float32Array(N_FFT);
  const real = new Float32Array(N_FFT);
  const imag = new Float32Array(N_FFT);
  const spectrum = new Float32Array(N_FFT / 2 + 1);
  const mel = new Float32Array(N_MELS * frames);

  for (let t = 0; t < frames; t++) {
    const offset = t * HOP;
    padded.fill(0);
    let previous = offset > 0 ? samples[offset - 1] : samples[offset];
    for (let i = 0; i < WIN; i++) {
      const sample = samples[offset + i];
      padded[i] = (sample - PRE_EMPHASIS * previous) * HANN[i];
      previous = sample;
    }
    powerSpectrum(padded, real, imag, spectrum);
    for (let m = 0; m < N_MELS; m++) {
      const row = FILTERBANK[m];
      let sum = 0;
      for (let k = 0; k < spectrum.length; k++) sum += spectrum[k] * row[k];
      mel[m * frames + t] = Math.log(sum + LOG_GUARD);
    }
  }

  // Per-feature normalisation over time, as the exported graph assumes.
  for (let m = 0; m < N_MELS; m++) {
    let mean = 0;
    for (let t = 0; t < frames; t++) mean += mel[m * frames + t];
    mean /= frames;
    let variance = 0;
    for (let t = 0; t < frames; t++) {
      const d = mel[m * frames + t] - mean;
      variance += d * d;
    }
    const sd = Math.sqrt(variance / frames) + 1e-5;
    for (let t = 0; t < frames; t++) {
      mel[m * frames + t] = (mel[m * frames + t] - mean) / sd;
    }
  }

  return { data: mel, frames };
}

let sessionPromise: Promise<OrtSession> | null = null;

/** Load the model once; later calls share the same session. */
export function loadConformer(): Promise<OrtSession> {
  if (!sessionPromise) {
    sessionPromise = loadOrt().then(runtime =>
      runtime.InferenceSession.create(MODEL_URL, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      }),
    );
  }
  return sessionPromise;
}

export function conformerReady(): boolean {
  return sessionPromise !== null;
}

/**
 * Posteriorgram for one stretch of audio: sqrt of the token probabilities with
 * blank removed, one vector per output frame (the model subsamples 4x).
 */
export async function posteriorgram(samples: Float32Array): Promise<Float32Array[]> {
  const { data, frames } = logMel(samples);
  if (frames < 8) return [];

  const runtime = await loadOrt();
  const session = await loadConformer();
  const signal = new runtime.Tensor('float32', data, [1, N_MELS, frames]);
  const length = new runtime.Tensor(
    'int64',
    BigInt64Array.from([BigInt(frames)]),
    [1],
  );
  const output = await session.run({
    processed_signal: signal,
    processed_signal_length: length,
  });

  const logits = output.log_probs;
  const [, steps, vocab] = logits.dims as number[];
  const values = logits.data as Float32Array;

  const out: Float32Array[] = [];
  for (let t = 0; t < steps; t++) {
    const base = t * vocab;
    // Softmax, then drop blank and take the square root so that a cosine
    // comparison behaves like a Bhattacharyya coefficient.
    let max = -Infinity;
    for (let v = 0; v < vocab; v++) max = Math.max(max, values[base + v]);
    let total = 0;
    const probs = new Float32Array(vocab);
    for (let v = 0; v < vocab; v++) {
      probs[v] = Math.exp(values[base + v] - max);
      total += probs[v];
    }
    const frame = new Float32Array(vocab - 1);
    let at = 0;
    for (let v = 0; v < vocab; v++) {
      if (v === BLANK_INDEX) continue;
      frame[at++] = Math.sqrt(probs[v] / total);
    }
    out.push(frame);
  }
  return out;
}
