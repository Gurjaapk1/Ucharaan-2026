// The /v1/score mapping, fed the three responses the live scorer gave for
// Pauri 1 (bjs recitation against ggs): whole pauri, line 7 skipped, 3 s clip.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import pauris from '../src/bani.json' with { type: 'json' };
import { pauriScore, seqsForPauri, toScoreResponse } from '../src/scoring/client.ts';

const seqs = seqsForPauri(pauris, 1);
const line = (seq, share) => ({
  seq,
  share_like: share,
  words: [{ idx: 0, state: share ? 'like' : 'check', reasons: [] }],
});
const whole = { status: 'ok', lines: seqs.map(seq => line(seq, 1)), focus: null };
const skipped = {
  status: 'ok',
  lines: seqs.map(seq => line(seq, seq === 7 ? 0 : 1)),
  focus: { seq: 7, idx: 7 },
};
const unclear = { status: 'unclear', lines: [], focus: null };

test('Pauri 1 is seqs 5-10', () => {
  assert.deepEqual(seqs, [5, 6, 7, 8, 9, 10]);
});

test('three different recordings give three different results', () => {
  const a = toScoreResponse(whole, seqs);
  const b = toScoreResponse(skipped, seqs);
  const c = toScoreResponse(unclear, seqs);

  assert.deepEqual(a.lineScores, [100, 100, 100, 100, 100, 100]);
  assert.equal(pauriScore(a.lineScores), 100);

  assert.deepEqual(b.lineScores, [100, 100, 0, 100, 100, 100]);
  assert.equal(pauriScore(b.lineScores), 83);
  assert.deepEqual(b.focus, { lineIndex: 2, wordIndex: 7 });

  // No score at all: the app asks for a retry instead of showing a number.
  assert.equal(c.status, 'unclear');
  assert.deepEqual(c.lineScores, []);

  assert.notEqual(pauriScore(a.lineScores), pauriScore(b.lineScores));
  for (const score of [pauriScore(a.lineScores), pauriScore(b.lineScores)]) {
    assert.notEqual(score, 84, '84 is the simulated challenge fixture, never a service result');
  }
});

test('shares are read as 0-1, an already-scaled percent is kept', () => {
  const r = toScoreResponse(
    { status: 'ok', lines: [line(5, 0.857), { ...line(6, 1), share_like: undefined, share_like_reciter: 0.5 }, line(7, 72)], focus: null },
    [5, 6, 7],
  );
  assert.deepEqual(r.lineScores, [86, 50, 72]);
});

test('a line the service did not return scores 0; unknown seqs are ignored', () => {
  const r = toScoreResponse({ status: 'ok', lines: [line(5, 1), line(99, 1)], focus: { seq: 99, idx: 0 } }, [5, 6]);
  assert.deepEqual(r.lineScores, [100, 0]);
  assert.equal(r.focus, null);
});

test('pauriScore of nothing is 0', () => {
  assert.equal(pauriScore([]), 0);
});
