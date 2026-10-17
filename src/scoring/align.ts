/**
 * Turning raw scores into what the review screen renders.
 *
 * The UI consumes ReviewedLine[] from wordFeedback.ts, whose `sampleWordReview`
 * is explicitly a display fixture. This builds the same shape from real scores,
 * reusing the same tokenizer so word offsets line up with the source text
 * exactly — the review screen relies on those offsets to highlight words.
 */

import {
  tokenizeLine,
  type ReviewToken,
  type ReviewedLine,
} from '../KidsMode/wordFeedback';
import type { ScoreResponse } from './types';

/** Below this a word is shown as needing practice. Calibrate against ustaad judgement. */
export const PRACTICE_THRESHOLD = 80;

/**
 * Pick the practice hint for a word. Until the scorer reports *where* in the
 * word the problem lies, this stays 'whole-word' rather than inventing a
 * position the data does not support.
 */
function focusFor(): 'ending' | 'beginning' | 'whole-word' {
  return 'whole-word';
}

/**
 * Build the review rows for one pauri.
 *
 * A word with no score from the provider is left at the line's score rather
 * than defaulting to zero — a missing measurement is not a failed word.
 */
export function toReviewedLines(
  lines: { text: string }[],
  response: ScoreResponse,
): ReviewedLine[] {
  const byWord = new Map<string, number>();
  for (const word of response.words) {
    byWord.set(`${word.lineIndex}:${word.wordIndex}`, word.score);
  }

  return lines.map((line, lineIndex) => {
    const lineScore = response.lineScores[lineIndex] ?? 0;
    const parts = tokenizeLine(line.text);
    let wordIndex = 0;

    const tokens: ReviewToken[] = parts.map(part => {
      if (!part.word) return { kind: 'separator', text: part.text };

      const index = wordIndex++;
      const score = byWord.get(`${lineIndex}:${index}`) ?? lineScore;
      return {
        kind: 'word',
        text: part.text,
        feedback: {
          id: `${lineIndex}:${index}`,
          text: part.text,
          lineIndex,
          wordIndex: index,
          start: part.start,
          end: part.end,
          score,
          focus: focusFor(),
        },
      };
    });

    return { text: line.text, score: lineScore, tokens };
  });
}
