/**
 * Recorded recitation, scored by the team's service.
 *
 * The child's voice goes to one file for the whole pauri; when they stop, the
 * file is posted once and the per-word verdicts come back. The service aligns
 * complete recordings, so there is no line-by-line following here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import type { Pauri } from '../KidsMode/types';
import { tokenizeLine, type ReviewedLine } from '../KidsMode/wordFeedback';
import { toReviewedLines } from '../scoring/align';
import {
  fetchManifest,
  referenceUrl,
  scoreRecording,
  seqsForPauri,
} from '../scoring/client';
import { BANI, DEFAULT_RECITER } from '../scoring/config';
import type { Manifest, ScoreResponse } from '../scoring/types';

export type RecordedOutcome =
  | { review: ReviewedLine[]; score: number }
  /** No score: shown as a prompt to try again. */
  | { retry: string };

const OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

type ManifestLine = Manifest['lines'][string][string];

/**
 * Service word idx -> on-screen word index, matched by Gurmukhi in order, so a
 * difference in how the two sides split a line cannot shift every highlight.
 */
function wordIndexMap(text: string, line: ManifestLine | undefined): Map<number, number> {
  const onScreen = tokenizeLine(text).filter(p => p.word).map(p => p.text);
  const map = new Map<number, number>();
  if (!line) return map;
  let from = 0;
  for (const word of line.words) {
    const at = onScreen.indexOf(word.gurmukhi, from);
    if (at >= 0) {
      map.set(word.idx, at);
      from = at + 1;
    }
  }
  return map;
}

function starsFor(percent: number, bands: number[]): number {
  return bands.filter(band => percent >= band).length;
}

/** Re-index words to the screen, then attach clips and star bands from the manifest. */
function toReview(
  pauri: Pauri,
  response: ScoreResponse,
  manifest: Manifest | null,
  reciter: string,
  seqs: number[],
): ReviewedLine[] {
  const lines = seqs.map(seq => manifest?.lines[reciter]?.[String(seq)]);
  const maps = pauri.lines.map((line, i) => wordIndexMap(line.text, lines[i]));
  const remap = (lineIndex: number, idx: number) => maps[lineIndex]?.get(idx) ?? idx;
  const review = toReviewedLines(pauri.lines, {
    ...response,
    words: response.words.map(w => ({ ...w, wordIndex: remap(w.lineIndex, w.wordIndex) })),
    focus: response.focus
      ? { ...response.focus, wordIndex: remap(response.focus.lineIndex, response.focus.wordIndex) }
      : null,
  });
  if (!manifest) return review;

  return review.map((line, lineIndex) => {
    const clips = new Map<number, string>();
    for (const word of lines[lineIndex]?.words ?? []) {
      clips.set(remap(lineIndex, word.idx), referenceUrl(word.clip_url));
    }
    return {
      ...line,
      stars: starsFor(line.score, manifest.star_bands),
      tokens: line.tokens.map(token =>
        token.kind === 'word' && clips.has(token.feedback.wordIndex)
          ? { ...token, feedback: { ...token.feedback, clip: clips.get(token.feedback.wordIndex) } }
          : token,
      ),
    };
  });
}

export function useRecordedRecitation(pauris: Pauri[]) {
  const recorder = useAudioRecorder(OPTIONS);
  const state = useAudioRecorderState(recorder, 100);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const pauriRef = useRef<number | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);

  // Scoring still works without it; only clips, bands and the coverage check are lost.
  useEffect(() => {
    fetchManifest().then(setManifest).catch(() => {});
  }, []);
  const reciter =
    !manifest || manifest.reciters.includes(DEFAULT_RECITER)
      ? DEFAULT_RECITER
      : manifest.reciters[0] ?? DEFAULT_RECITER;

  useEffect(() => {
    getRecordingPermissionsAsync()
      .then(({ granted: already }) => setGranted(already))
      .catch(() => setGranted(false));
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const allowed = (await requestRecordingPermissionsAsync()).granted;
      setGranted(allowed);
      return allowed;
    } catch {
      return false;
    }
  }, []);

  const start = useCallback(
    async (pauriNumber: number) => {
      setError(null);
      pauriRef.current = pauriNumber;
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        return true;
      } catch (caught) {
        setError((caught as Error)?.message ?? 'Could not open the microphone');
        return false;
      }
    },
    [recorder],
  );

  const stop = useCallback(async (): Promise<RecordedOutcome | null> => {
    try {
      await recorder.stop();
    } catch {
      // Already stopped; the file, if any, is still at recorder.uri.
    }
    // Leaving recording mode on routes playback to the iPhone earpiece.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});

    const pauri = pauris.find(p => p.number === pauriRef.current);
    const uri = recorder.uri;
    if (!pauri || !uri) return { retry: 'Nothing was recorded. Please try again.' };

    const seqs = seqsForPauri(pauris, pauri.number);
    if (manifest && !seqs.every(seq => manifest.lines[reciter]?.[String(seq)])) {
      return { retry: 'Online checking does not cover this pauri yet. Try Pauri 1.' };
    }

    setChecking(true);
    try {
      const response = await scoreRecording(uri, { bani: BANI, reciter, seqs });
      if (response.status === 'unclear') {
        return {
          retry: 'We could not hear that clearly. Find a quiet place and try again.',
        };
      }
      const review = toReview(pauri, response, manifest, reciter, seqs);
      const score = response.lineScores.length
        ? Math.round(response.lineScores.reduce((n, s) => n + s, 0) / response.lineScores.length)
        : 0;
      return { review, score };
    } catch (caught) {
      const message = (caught as Error)?.message ?? 'That recitation could not be checked.';
      setError(message);
      return { retry: message };
    } finally {
      setChecking(false);
    }
  }, [recorder, pauris, manifest, reciter]);

  // Metering is dBFS, roughly -60 (quiet room) to 0.
  const metering = state.metering ?? -160;
  return {
    granted,
    requestPermission,
    start,
    stop,
    isRecording: state.isRecording,
    level: Math.max(0, Math.min(1, (metering + 60) / 60)),
    currentLine: 0,
    lineScores: [],
    error,
    checking,
    following: false,
  };
}
