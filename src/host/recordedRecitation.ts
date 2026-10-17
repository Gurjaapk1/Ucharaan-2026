/**
 * Recorded recitation, scored by the team's service.
 *
 * The child's voice goes to one file for the whole pauri; when they stop, the
 * file is posted once and the per-word verdicts come back. The service aligns
 * complete recordings, so there is no line-by-line following here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
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
  /** Every line is done; the pauri's review is ready. */
  | { review: ReviewedLine[]; score: number }
  /** This line is scored and recording has begun on the next one. */
  | { nextLine: number; lineScore: number }
  /** No score for this line: the child should recite it again. */
  | { retry: string };

const OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

/**
 * iOS refuses the microphone when something else holds the audio input.
 * 561017449 is '!pri', AVAudioSessionErrorCodeInsufficientPriority — usually
 * our own reference player, since the session is still set up for playback.
 */
const INSUFFICIENT_PRIORITY = '561017449';

/** Give the audio session a moment to change category before retrying. */
const SESSION_SETTLE_MS = 350;

function describeAudioError(caught: unknown): string {
  const message = (caught as Error)?.message ?? String(caught);
  if (message.includes(INSUFFICIENT_PRIORITY)) {
    return 'Another app is using the microphone. Close it (or end any call) and try again.';
  }
  return message || 'Could not open the microphone';
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  // Line-by-line: each line is recorded and scored on its own, so a fumbled
  // line can be repeated without losing the rest of the pauri.
  const lineRef = useRef(0);
  const lineCountRef = useRef(0);
  const perLineRef = useRef<Map<number, { score: number; words: ScoreResponse['words'] }>>(
    new Map(),
  );
  const [lineScores, setLineScores] = useState<{ lineIndex: number; score: number }[]>([]);
  const [currentLine, setCurrentLine] = useState(0);

  // Scoring still works without it; only clips, bands and the coverage check are lost.
  useEffect(() => {
    fetchManifest().then(setManifest).catch(() => {});
  }, []);
  const reciter =
    !manifest || manifest.reciters.includes(DEFAULT_RECITER)
      ? DEFAULT_RECITER
      : manifest.reciters[0] ?? DEFAULT_RECITER;

  useEffect(() => {
    // On web this check falls through to a getUserMedia prompt, so ask only when the child begins.
    if (Platform.OS === 'web') return;
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

  /** Begin capturing one line; used by start() and by the advance in stop(). */
  const beginRecording = useCallback(async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        if (attempt > 0) await wait(SESSION_SETTLE_MS);
        await recorder.prepareToRecordAsync();
        recorder.record();
        return true;
      } catch (caught) {
        const message = describeAudioError(caught);
        console.log(`[recitation] begin attempt ${attempt + 1} failed`, {
          raw: (caught as Error)?.message ?? String(caught),
          shown: message,
        });
        if (attempt >= 1) {
          setError(message);
          return false;
        }
      }
    }
    return false;
  }, [recorder]);

  const start = useCallback(
    async (pauriNumber: number, lineCount = 0) => {
      setError(null);
      pauriRef.current = pauriNumber;
      lineCountRef.current = lineCount;
      lineRef.current = 0;
      perLineRef.current = new Map();
      setLineScores([]);
      setCurrentLine(0);
      return beginRecording();
    },
    [beginRecording],
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

    const lineIndex = lineRef.current;
    const seq = seqs[lineIndex];
    if (seq === undefined) return { retry: 'That line is not in the recording.' };

    setChecking(true);
    try {
      // One line at a time: the service takes a range, so this is a range of one.
      const response = await scoreRecording(uri, { bani: BANI, reciter, seqs: [seq] });
      if (response.status === 'unclear') {
        return {
          retry: 'We could not hear that clearly. Find a quiet place and say the line again.',
        };
      }

      const lineScore = response.lineScores[0] ?? 0;
      // The service numbers words within the range it was given — index 0 here
      // — so re-key them onto this line's position in the pauri.
      perLineRef.current.set(lineIndex, {
        score: lineScore,
        words: response.words.map(w => ({ ...w, lineIndex })),
      });
      setLineScores(
        [...perLineRef.current.entries()]
          .map(([i, r]) => ({ lineIndex: i, score: r.score }))
          .sort((a, b) => a.lineIndex - b.lineIndex),
      );

      const next = lineIndex + 1;
      if (next < lineCountRef.current) {
        lineRef.current = next;
        setCurrentLine(next);
        // Keep the microphone open so the child carries straight on.
        await beginRecording();
        return { nextLine: next, lineScore };
      }

      // Last line: assemble the pauri from every line's verdicts, through the
      // same toReview so clips and star bands still come from the manifest.
      const gathered = perLineRef.current;
      const combined: ScoreResponse = {
        status: 'ok',
        lineScores: pauri.lines.map((_, i) => gathered.get(i)?.score ?? 0),
        words: pauri.lines.flatMap((_, i) => gathered.get(i)?.words ?? []),
        provider: 'service',
        focus: null,
      };
      const review = toReview(pauri, combined, manifest, reciter, seqs);
      const heard = [...gathered.values()].map(r => r.score);
      const score = heard.length
        ? Math.round(heard.reduce((n, v) => n + v, 0) / heard.length)
        : 0;
      return { review, score };
    } catch (caught) {
      const message = (caught as Error)?.message ?? 'That recitation could not be checked.';
      setError(message);
      return { retry: message };
    } finally {
      setChecking(false);
    }
  }, [recorder, pauris, manifest, reciter, beginRecording]);

  // Metering is dBFS, roughly -60 (quiet room) to 0.
  const metering = state.metering ?? -160;
  return {
    granted,
    requestPermission,
    start,
    stop,
    isRecording: state.isRecording,
    level: Math.max(0, Math.min(1, (metering + 60) / 60)),
    currentLine,
    lineScores,
    error,
    checking,
    following: true,
  };
}
