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
import type { ReviewedLine } from '../KidsMode/wordFeedback';
import { toReviewedLines } from '../scoring/align';
import { scoreRecording, seqsForPauri } from '../scoring/client';
import { BANI, DEFAULT_RECITER } from '../scoring/config';

export type RecordedOutcome =
  | { review: ReviewedLine[]; score: number }
  /** No score: shown as a prompt to try again. */
  | { retry: string };

const OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

export function useRecordedRecitation(pauris: Pauri[]) {
  const recorder = useAudioRecorder(OPTIONS);
  const state = useAudioRecorderState(recorder, 100);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const pauriRef = useRef<number | null>(null);

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

    setChecking(true);
    try {
      const response = await scoreRecording(uri, {
        bani: BANI,
        reciter: DEFAULT_RECITER,
        seqs: seqsForPauri(pauris, pauri.number),
      });
      if (response.status === 'unclear') {
        return {
          retry: 'We could not hear that clearly. Find a quiet place and try again.',
        };
      }
      const review = toReviewedLines(pauri.lines, response);
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
  }, [recorder, pauris]);

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
