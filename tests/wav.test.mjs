// encodeWav16: the 16-bit mono WAV that /v1/follow receives.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decodeWav, encodeWav16 } from '../src/scoring/dsp/wav.ts';

const ascii = (bytes, at) => String.fromCharCode(...bytes.subarray(at, at + 4));

test('header fields for 16 kHz mono 16-bit', () => {
  const chunks = [new Float32Array(1000), new Float32Array(600)];
  const wav = encodeWav16(chunks, 16000);
  const view = new DataView(wav.buffer);
  const n = 1600;

  assert.equal(wav.length, 44 + 2 * n);
  assert.equal(ascii(wav, 0), 'RIFF');
  assert.equal(view.getUint32(4, true), 36 + 2 * n);
  assert.equal(ascii(wav, 8), 'WAVE');
  assert.equal(ascii(wav, 12), 'fmt ');
  assert.equal(view.getUint32(16, true), 16);
  assert.equal(view.getUint16(20, true), 1, 'PCM');
  assert.equal(view.getUint16(22, true), 1, 'mono');
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getUint32(28, true), 32000, 'byte rate');
  assert.equal(view.getUint16(32, true), 2, 'block align');
  assert.equal(view.getUint16(34, true), 16, 'bits');
  assert.equal(ascii(wav, 36), 'data');
  assert.equal(view.getUint32(40, true), 2 * n);
});

test('samples are written in order across chunks, clamped at full scale', () => {
  const wav = encodeWav16([new Float32Array([0, 0.5, -0.5]), new Float32Array([1, -1, 2, -2, NaN])], 16000);
  const view = new DataView(wav.buffer);
  const at = i => view.getInt16(44 + 2 * i, true);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map(at), [0, 16383, -16384, 32767, -32768, 32767, -32768, 0]);
});

test('no samples gives a valid empty WAV', () => {
  const wav = encodeWav16([], 16000);
  assert.equal(wav.length, 44);
  assert.equal(new DataView(wav.buffer).getUint32(40, true), 0);
});

test('round-trips through the app’s own WAV reader', () => {
  const tone = Float32Array.from({ length: 16000 }, (_, i) => 0.5 * Math.sin((2 * Math.PI * 440 * i) / 16000));
  const pcm = decodeWav(encodeWav16([tone], 16000).buffer);
  assert.equal(pcm.sampleRate, 16000);
  assert.equal(pcm.channels, 1);
  assert.equal(pcm.samples.length, 16000);
  assert.ok(pcm.samples.every((s, i) => Math.abs(s - tone[i]) < 1e-4));
});
