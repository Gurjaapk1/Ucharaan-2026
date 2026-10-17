/**
 * Minimal WAV reader.
 *
 * The recorder writes uncompressed LinearPCM so the samples can be read
 * without decoding anything — there is no AAC decoder available in JS, and
 * shelling out to one on device is not an option.
 */

export interface Pcm {
  samples: Float32Array;
  sampleRate: number;
  channels: number;
}

export class WavError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WavError';
  }
}

function fourCC(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

/**
 * Decode a RIFF/WAVE buffer to mono float samples in [-1, 1].
 *
 * Chunks are walked rather than assumed at fixed offsets: recorders routinely
 * insert LIST or fact chunks before the data, and a fixed 44-byte header
 * assumption would read metadata as audio.
 */
export function decodeWav(buffer: ArrayBuffer): Pcm {
  const view = new DataView(buffer);
  if (buffer.byteLength < 12) throw new WavError('File is too short to be WAV');
  if (fourCC(view, 0) !== 'RIFF' || fourCC(view, 8) !== 'WAVE') {
    throw new WavError('Not a RIFF/WAVE file');
  }

  let format = -1;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = -1;
  let dataLength = 0;

  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const id = fourCC(view, offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;

    if (id === 'fmt ') {
      format = view.getUint16(body, true);
      channels = view.getUint16(body + 2, true);
      sampleRate = view.getUint32(body + 4, true);
      bitsPerSample = view.getUint16(body + 14, true);
    } else if (id === 'data') {
      dataOffset = body;
      dataLength = Math.min(size, buffer.byteLength - body);
    }

    // Chunks are word-aligned; an odd size is followed by a pad byte.
    offset = body + size + (size % 2);
  }

  if (dataOffset < 0) throw new WavError('No data chunk');
  if (channels < 1) throw new WavError('No channels declared');

  const isFloat = format === 3;
  if (format !== 1 && !isFloat) {
    throw new WavError(`Unsupported WAV format ${format}; expected PCM or float`);
  }

  const bytesPerSample = bitsPerSample / 8;
  const frameCount = Math.floor(dataLength / (bytesPerSample * channels));
  const samples = new Float32Array(frameCount);

  for (let frame = 0; frame < frameCount; frame++) {
    let sum = 0;
    for (let channel = 0; channel < channels; channel++) {
      const at = dataOffset + (frame * channels + channel) * bytesPerSample;
      if (isFloat) {
        sum += view.getFloat32(at, true);
      } else if (bitsPerSample === 16) {
        sum += view.getInt16(at, true) / 32768;
      } else if (bitsPerSample === 32) {
        sum += view.getInt32(at, true) / 2147483648;
      } else if (bitsPerSample === 8) {
        sum += (view.getUint8(at) - 128) / 128;
      } else {
        throw new WavError(`Unsupported bit depth ${bitsPerSample}`);
      }
    }
    // Mix to mono: the comparison is on spectral shape, not stereo image.
    samples[frame] = sum / channels;
  }

  return { samples, sampleRate, channels };
}

/** Take the slice between two times, clamped to the signal. */
export function slice(pcm: Pcm, startSeconds: number, endSeconds: number): Float32Array {
  const from = Math.max(0, Math.floor(startSeconds * pcm.sampleRate));
  const to = Math.min(pcm.samples.length, Math.ceil(endSeconds * pcm.sampleRate));
  return to > from ? pcm.samples.subarray(from, to) : new Float32Array(0);
}
