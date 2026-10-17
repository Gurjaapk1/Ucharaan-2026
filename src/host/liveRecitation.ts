/**
 * Live recitation.
 *
 * The microphone is streamed, not recorded-then-read: PCM buffers arrive while
 * the child is still reciting, features are computed as they arrive, and each
 * line is scored the moment it ends. That is what lets the challenge follow
 * the child's voice and show a line's result immediately, rather than going
 * quiet until the whole pauri is finished.
 *
 * Everything stays on the device. No audio is written to disk or uploaded.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioStream,
  type AudioStreamBuffer,
} from 'expo-audio';

import { Resampler } from '../scoring/dsp/resample';
import { scoreSamplesWithWarpSearch } from '../scoring/localScorer';
import { requestWebMicrophone, useWebAudioStream } from './webAudioStream';
import { scoreLine, type Features } from '../scoring/localScorer';
import { referenceFeatures } from '../scoring/reference';

/** Matches the sample rate the reference features were computed at. */
export const STREAM_SAMPLE_RATE = 16000;

/**
 * Hysteresis thresholds, in dB above the noise floor.
 *
 * A single threshold makes the detector chatter around it. Speech must clear
 * the higher bar to begin and fall below the lower bar to end, so a brief dip
 * mid-word does not cut a line short.
 */
const SPEECH_ON_DB = 12;
const SPEECH_OFF_DB = 6;

/** The floor is never allowed above this, or speech cannot clear the bar. */
const MAX_FLOOR_DB = -30;

/**
 * The room is measured for this long before any speech is accepted.
 *
 * Starting from an assumed floor made every room with audible background
 * noise read as continuous speech, so no gaps between lines were ever found
 * and only the first line was scored — the rest reported "0%" when the truth
 * was that they were never heard.
 */
const CALIBRATE_MS = 600;

/** Silence this long after speech ends a line. */
const LINE_GAP_MS = 650;

/** A line shorter than this is a cough or a false start, not a recitation. */
const MIN_LINE_MS = 400;

function rmsDb(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  const rms = Math.sqrt(sum / Math.max(1, samples.length));
  return 20 * Math.log10(Math.max(rms, 1e-7));
}

export interface LiveLineResult {
  lineIndex: number;
  score: number;
  cost: number;
}

export interface LiveRecitation {
  /**
   * False where the platform has no microphone stream. expo-audio's web
   * implementation is a stub that returns a null stream, so the caller must
   * not offer live recitation there.
   */
  supported: boolean;
  granted: boolean;
  requestPermission: () => Promise<boolean>;
  start: (pauriNumber: number, lineCount: number) => Promise<boolean>;
  stop: () => Promise<LiveLineResult[]>;
  isStreaming: boolean;
  /** 0-1 input level for a meter. */
  level: number;
  /** Index of the line currently being recited. */
  currentLine: number;
  /** Scores for lines finished so far, in order. */
  results: LiveLineResult[];
  error: string | null;
}

/** Flip on to trace the capture path in the console. */
const DEBUG = true;

export function useLiveRecitation(): LiveRecitation {
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [results, setResults] = useState<LiveLineResult[]>([]);

  // Everything the audio callback touches lives in refs: it fires many times a
  // second and must not depend on a re-render having happened.
  /** Built on the first buffer, once the hardware's real rate is known. */
  const resamplerRef = useRef<Resampler | null>(null);
  /**
   * Raw 16 kHz samples for the line being recited. Kept as audio rather than
   * features because the warp search needs to re-extract under several
   * filterbanks, which cannot be done from already-computed frames.
   */
  const lineSamplesRef = useRef<Float32Array[]>([]);
  /** The warp that fitted this child best so far. */
  const warpRef = useRef(1);
  const pauriRef = useRef(0);
  const lineCountRef = useRef(0);
  const lineRef = useRef(0);
  const resultsRef = useRef<LiveLineResult[]>([]);
  const activeRef = useRef(false);

  const noiseFloorRef = useRef(-60);
  /** Levels seen while calibrating; their median becomes the floor. */
  const calibrationRef = useRef<number[]>([]);
  const calibratedMsRef = useRef(0);
  const spokeRef = useRef(false);
  const silenceMsRef = useRef(0);
  const lineMsRef = useRef(0);

  /** Score the frames gathered for the current line and move on. */
  const finishLine = useCallback(() => {
    const chunks = lineSamplesRef.current;
    lineSamplesRef.current = [];
    silenceMsRef.current = 0;
    spokeRef.current = false;
    lineMsRef.current = 0;

    const index = lineRef.current;
    if (DEBUG) console.log('[rec] finishLine', { index, chunks: chunks.length });
    if (index >= lineCountRef.current) return;

    const reference = referenceFeatures(pauriRef.current, index);
    // No reference means this line cannot be judged; skip it rather than
    // recording a zero the child did not earn.
    if (reference && chunks.length > 0) {
      const total = chunks.reduce((n, c) => n + c.length, 0);
      const samples = new Float32Array(total);
      let at = 0;
      for (const chunk of chunks) {
        samples.set(chunk, at);
        at += chunk.length;
      }

      const { score, cost, warp } = scoreSamplesWithWarpSearch(
        samples,
        STREAM_SAMPLE_RATE,
        reference,
        warpRef.current,
      );
      // Carry the fitted warp forward: the child's voice does not change
      // between lines, and holding it steady keeps noisy lines from drifting.
      warpRef.current = warp;

      const result = { lineIndex: index, score, cost };
      resultsRef.current = [...resultsRef.current, result];
      setResults(resultsRef.current);
    }

    lineRef.current = index + 1;
    setCurrentLine(lineRef.current);
  }, []);

  const onBuffer = useCallback(
    (buffer: AudioStreamBuffer) => {
      if (!activeRef.current) {
        if (DEBUG) console.log('[rec] buffer ignored: not active');
        return;
      }

      const incoming = new Float32Array(buffer.data);
      const ms = (incoming.length / buffer.sampleRate) * 1000;

      // Hardware often ignores the requested rate. Features must be computed
      // at the rate the reference was built at or they are not comparable.
      if (!resamplerRef.current) {
        resamplerRef.current = new Resampler(buffer.sampleRate, STREAM_SAMPLE_RATE);
      }
      const samples = resamplerRef.current.push(incoming);
      if (DEBUG && Math.random() < 0.15) {
        console.log('[rec] buffer', {
          inRate: buffer.sampleRate,
          inLen: incoming.length,
          outLen: samples.length,
        });
      }
      if (samples.length === 0) return;

      const db = rmsDb(samples);

      // Measure the room first; until then nothing counts as speech.
      if (calibratedMsRef.current < CALIBRATE_MS) {
        calibratedMsRef.current += ms;
        calibrationRef.current.push(db);
        if (calibratedMsRef.current >= CALIBRATE_MS) {
          // Median, so a single click or chair creak cannot set the floor.
          const seen = [...calibrationRef.current].sort((a, b) => a - b);
          noiseFloorRef.current = Math.min(
            MAX_FLOOR_DB,
            seen[Math.floor(seen.length / 2)] ?? -60,
          );
          if (DEBUG) {
            console.log('[rec] calibrated floor', noiseFloorRef.current.toFixed(1));
          }
        }
        setLevel(Math.max(0, Math.min(1, (db + 60) / 60)));
        return;
      }

      // Hysteresis: once speaking, keep speaking until the level falls well
      // below the bar, so a dip between syllables does not end the line.
      const floor = noiseFloorRef.current;
      const speaking = spokeRef.current
        ? db > floor + SPEECH_OFF_DB
        : db > floor + SPEECH_ON_DB;

      // Adapt the floor only on quiet frames, and slowly. Updating it every
      // frame let a pause drag the floor down to the silence level, after
      // which the child's voice sat permanently above the bar and no gap
      // between lines was ever found.
      if (!speaking) {
        noiseFloorRef.current = Math.min(MAX_FLOOR_DB, floor * 0.95 + db * 0.05);
      }
      if (DEBUG && Math.random() < 0.15) {
        console.log('[rec] vad', {
          db: db.toFixed(1),
          floor: noiseFloorRef.current.toFixed(1),
          speaking,
          chunks: lineSamplesRef.current.length,
          line: lineRef.current,
        });
      }

      setLevel(Math.max(0, Math.min(1, (db + 60) / 60)));

      // Features are collected whenever the child might be speaking; leading
      // silence is dropped so it cannot dilute the line's score.
      if (speaking || spokeRef.current) {
        lineSamplesRef.current.push(samples);
        lineMsRef.current += ms;
      }

      if (speaking) {
        spokeRef.current = true;
        silenceMsRef.current = 0;
        return;
      }

      if (!spokeRef.current) return;

      silenceMsRef.current += ms;
      if (
        silenceMsRef.current >= LINE_GAP_MS &&
        lineMsRef.current >= MIN_LINE_MS
      ) {
        finishLine();
      }
    },
    [finishLine],
  );

  const isWeb = Platform.OS === 'web';

  // expo-audio's web implementation is a stub returning a null stream, so the
  // browser uses a getUserMedia-backed stream with the same contract. Both
  // hooks run every render; only one is wired up.
  const native = useAudioStream({
    sampleRate: STREAM_SAMPLE_RATE,
    channels: 1,
    encoding: 'float32',
    onBuffer: isWeb ? undefined : onBuffer,
  });
  const web = useWebAudioStream(
    isWeb ? { sampleRate: STREAM_SAMPLE_RATE, onBuffer } : null,
  );
  const stream = isWeb ? web.stream : native.stream;
  const isStreaming = isWeb ? web.isStreaming : native.isStreaming;

  useEffect(() => {
    // The browser only reveals microphone permission by asking for it, so the
    // web starts as "not yet granted" and prompts when the child begins.
    if (isWeb) return;
    getRecordingPermissionsAsync()
      .then(({ granted: already }) => setGranted(already))
      .catch(() => setGranted(false));
  }, [isWeb]);

  const requestPermission = useCallback(async () => {
    try {
      const allowed = isWeb
        ? await requestWebMicrophone()
        : (await requestRecordingPermissionsAsync()).granted;
      setGranted(allowed);
      return allowed;
    } catch {
      return false;
    }
  }, [isWeb]);

  const start = useCallback(
    async (pauriNumber: number, lineCount: number) => {
      setError(null);
      setResults([]);
      setCurrentLine(0);
      pauriRef.current = pauriNumber;
      lineCountRef.current = lineCount;
      lineRef.current = 0;
      resultsRef.current = [];
      lineSamplesRef.current = [];
      warpRef.current = 1;
      noiseFloorRef.current = -60;
      calibrationRef.current = [];
      calibratedMsRef.current = 0;
      spokeRef.current = false;
      silenceMsRef.current = 0;
      lineMsRef.current = 0;

      if (!stream) {
        setError('This platform cannot capture live audio');
        return false;
      }

      if (!stream) {
        setError('This device cannot capture live audio');
        return false;
      }

      try {
        if (!isWeb) {
          await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        }
        await stream.start();
        activeRef.current = true;
        if (DEBUG) console.log('[rec] started', { isWeb, pauriNumber, lineCount });
        return true;
      } catch (caught) {
        if (DEBUG) console.log('[rec] start FAILED', caught);
        setError((caught as Error)?.message ?? 'Could not open the microphone');
        return false;
      }
    },
    [stream, isWeb],
  );

  const stop = useCallback(async () => {
    activeRef.current = false;
    // Whatever was mid-line when they stopped still counts.
    if (lineSamplesRef.current.length > 0) finishLine();
    try {
      stream?.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
      // Already stopped, or the session was taken by something else.
    }
    return resultsRef.current;
  }, [stream, isWeb, finishLine]);

  // Never leave the microphone open behind us — but only on unmount. Keying
  // this to `stream` closed the microphone on every render that changed its
  // identity, which is exactly what stopped audio ever arriving.
  const streamRef = useRef(stream);
  streamRef.current = stream;
  useEffect(
    () => () => {
      activeRef.current = false;
      try {
        streamRef.current?.stop();
      } catch {
        // Nothing to stop.
      }
    },
    [],
  );

  return {
    supported: stream !== null && stream !== undefined,
    granted,
    requestPermission,
    start,
    stop,
    isStreaming,
    level,
    currentLine,
    results,
    error,
  };
}
