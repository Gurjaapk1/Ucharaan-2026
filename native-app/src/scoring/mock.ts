/**
 * Canned service responses for EXPO_PUBLIC_SCORING_MOCK=1.
 *
 * Built from the app's own text so word indexes line up with what is on screen.
 */

import pauris from '../bani.json';
import { tokenizeLine } from '../KidsMode/wordFeedback';
import { FIRST_PAURI_SEQ } from './config';
import type { Manifest, ServiceScoreResponse } from './types';

function wordsBySeq(): Map<number, string[]> {
  const out = new Map<number, string[]>();
  let seq = FIRST_PAURI_SEQ;
  for (const pauri of pauris as { lines: { text: string }[] }[]) {
    for (const line of pauri.lines) {
      out.set(seq++, tokenizeLine(line.text).filter(p => p.word).map(p => p.text));
    }
  }
  return out;
}

export function mockManifest(): Manifest {
  const lines: Manifest['lines'][string] = {};
  for (const [seq, words] of wordsBySeq()) {
    lines[String(seq)] = {
      pankti_url: `ggs/${seq}/pankti.wav`,
      words: words.map((gurmukhi, idx) => ({
        idx, gurmukhi, roman: '', start_s: 0, end_s: 0,
        clip_url: `ggs/${seq}/words/${idx}.wav`, rule: null,
      })),
    };
  }
  return { bani: 2, reciters: ['bjs', 'ggs', 'imk'], lines: { bjs: lines, ggs: lines, imk: lines }, star_bands: [60, 80, 95] };
}

/** All `like` except the second word of the first line, which becomes the focus. */
export function mockScore(seqs: number[]): ServiceScoreResponse {
  const words = wordsBySeq();
  const flagged = { seq: seqs[0], idx: Math.min(1, (words.get(seqs[0])?.length ?? 1) - 1) };
  return {
    status: 'ok',
    lines: seqs.map(seq => {
      const count = words.get(seq)?.length ?? 0;
      const check = seq === flagged.seq ? 1 : 0;
      return {
        seq,
        share_like: count ? (count - check) / count : 0,
        words: Array.from({ length: count }, (_, idx) => ({
          idx,
          state: seq === flagged.seq && idx === flagged.idx ? 'check' as const : 'like' as const,
          reasons: seq === flagged.seq && idx === flagged.idx ? ['Sample: listen to the vowel'] : [],
        })),
      };
    }),
    focus: flagged,
  };
}
