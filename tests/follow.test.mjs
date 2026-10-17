// Live following: mapping /v1/follow onto the screen, and cancelling a poll.
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { toLive } from '../src/host/followedRecitation.ts';
import { followRecording } from '../src/scoring/client.ts';
import { encodeWav16 } from '../src/scoring/dsp/wav.ts';

// Two short lines; the service splits the first one differently from the screen.
const pauri = { number: 1, lines: [{ text: 'ਸੋਚੈ ਸੋਚਿ ਨ ਹੋਵਈ ॥' }, { text: 'ਚੁਪੈ ਚੁਪ ॥' }] };
const seqs = [5, 6];
const word = (idx, gurmukhi, state) => ({ idx, gurmukhi, state });

test('reached words map to on-screen indexes; pending words and unknown seqs are dropped', () => {
  const live = toLive(
    {
      status: 'ok',
      reached: { seq: 6, idx: 0 },
      lines: [
        // The service has an extra token at idx 0 that is not on screen.
        { seq: 5, words: [word(0, 'ੴ', 'like'), word(1, 'ਸੋਚੈ', 'like'), word(2, 'ਸੋਚਿ', 'check'), word(3, 'ਨ', 'unclear'), word(4, 'ਹੋਵਈ', 'like')] },
        { seq: 6, words: [word(0, 'ਚੁਪੈ', 'like'), word(1, 'ਚੁਪ', 'pending')] },
        { seq: 99, words: [word(0, 'x', 'check')] },
      ],
    },
    pauri,
    seqs,
  );
  assert.deepEqual(live.words, [
    // Unmatched idx 0 falls back to its raw index and lands on the first word too.
    { lineIndex: 0, wordIndex: 0, state: 'like' },
    { lineIndex: 0, wordIndex: 0, state: 'like' },
    { lineIndex: 0, wordIndex: 1, state: 'check' },
    { lineIndex: 0, wordIndex: 2, state: 'unclear' },
    { lineIndex: 0, wordIndex: 3, state: 'like' },
    { lineIndex: 1, wordIndex: 0, state: 'like' },
  ]);
  assert.deepEqual(live.reached, { lineIndex: 1, wordIndex: 0 });
});

test('reached on a seq outside the pauri is no position', () => {
  const live = toLive({ status: 'ok', reached: { seq: 40, idx: 2 }, lines: [] }, pauri, seqs);
  assert.deepEqual(live, { words: [], reached: null });
});

afterEach(() => {
  delete globalThis.__onFileWrite;
  delete globalThis.__platform;
});

test('native: a stop during the WAV write sends nothing', async () => {
  globalThis.__platform = 'ios';
  const controller = new AbortController();
  globalThis.__onFileWrite = () => controller.abort();
  let fetched = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    fetched++;
    if (init.signal.aborted) throw new DOMException('aborted', 'AbortError');
    return new Response('{"status":"ok","reached":null,"lines":[]}', { status: 200 });
  };
  try {
    const wav = encodeWav16([new Float32Array(16000)], 16000);
    const body = await followRecording(wav, { bani: 2, reciter: 'ggs', seqs, signal: controller.signal });
    assert.equal(body, null);
    assert.ok(fetched <= 1);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('a 404 means the endpoint is absent and is thrown; other failures are null', async () => {
  globalThis.__platform = 'web';
  const realFetch = globalThis.fetch;
  const wav = encodeWav16([new Float32Array(16000)], 16000);
  const opts = { bani: 2, reciter: 'ggs', seqs };
  try {
    globalThis.fetch = async () => new Response('', { status: 404 });
    await assert.rejects(followRecording(wav, opts), { name: 'ScoringError', status: 404 });
    globalThis.fetch = async () => new Response('', { status: 500 });
    assert.equal(await followRecording(wav, opts), null);
    globalThis.fetch = async () => { throw new TypeError('network'); };
    assert.equal(await followRecording(wav, opts), null);
  } finally {
    globalThis.fetch = realFetch;
  }
});
