/**
 * Pure state machine for pauri-by-pauri practice.
 *
 * Kept free of React so the walk through a bani can be tested directly, and
 * so swapping hand-entered marks for the uchaaran scorer's verdict later
 * touches only the caller.
 */

import type { Pauri, LineScore, PauriResult } from './pauris';

export interface PracticeState {
  /** Index into the pauri list. */
  pauriIndex: number;
  /** Index of the line being assessed inside the current pauri. */
  lineIndex: number;
  /** Results so far, keyed by pauri index. */
  results: Record<number, PauriResult>;
}

export const initialPracticeState: PracticeState = {
  pauriIndex: 0,
  lineIndex: 0,
  results: {},
};

function resultFor(state: PracticeState, pauriIndex: number): PauriResult {
  return state.results[pauriIndex] ?? { pauriIndex, scores: {} };
}

/** How many lines of the current pauri carry a mark. */
export function scoredCount(state: PracticeState): number {
  return Object.keys(resultFor(state, state.pauriIndex).scores).length;
}

/** True once every line of the current pauri has been marked. */
export function isPauriComplete(
  pauris: Pauri[],
  state: PracticeState,
): boolean {
  const pauri = pauris[state.pauriIndex];
  if (!pauri) return false;
  // Count distinct marked lines of THIS pauri, so a repeated verseId or a
  // stale mark from elsewhere can never read as complete.
  const scores = resultFor(state, state.pauriIndex).scores;
  return pauri.lines.every(line => scores[line.verseId] !== undefined);
}

/** Mark the current line and move to the next one within the pauri. */
export function scoreLine(
  pauris: Pauri[],
  state: PracticeState,
  mark: LineScore,
): PracticeState {
  const pauri = pauris[state.pauriIndex];
  if (!pauri) return state;

  const line = pauri.lines[state.lineIndex];
  if (!line) return state;

  const existing = resultFor(state, state.pauriIndex);
  return {
    ...state,
    // Hold at the last line; completion is what ends the pauri, not the index.
    lineIndex: Math.min(state.lineIndex + 1, pauri.lines.length - 1),
    results: {
      ...state.results,
      [state.pauriIndex]: {
        pauriIndex: state.pauriIndex,
        scores: { ...existing.scores, [line.verseId]: mark },
      },
    },
  };
}

/** Advance to the next pauri, starting at its first line. */
export function goToNextPauri(
  pauris: Pauri[],
  state: PracticeState,
): PracticeState {
  if (state.pauriIndex >= pauris.length - 1) return state;
  return { ...state, pauriIndex: state.pauriIndex + 1, lineIndex: 0 };
}

/** Clear the current pauri's marks and start it over. */
export function redoPauri(state: PracticeState): PracticeState {
  const { [state.pauriIndex]: _cleared, ...rest } = state.results;
  return { ...state, lineIndex: 0, results: rest };
}
