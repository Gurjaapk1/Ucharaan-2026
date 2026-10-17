/**
 * Recorded recitation with live word-by-word following.
 *
 * The same file recorder as recordedRecitation runs for the final /v1/score.
 * Alongside it the microphone is streamed as PCM, resampled to 16 kHz and
 * kept; every FOLLOW_INTERVAL_MS the recording so far goes to /v1/follow as a
 * WAV, and the per-word states it returns are shown on the pankti while the
 * child is still reciting. The final score replaces them on stop.
 *
 * Where no PCM stream exists, or it fails to start, this is exactly the
 * recorded flow: record, score on stop.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAudioStream, type AudioStreamBuffer } from 'expo-audio';

import type { Pauri } from '../KidsMode/types';
import { followRecording, seqsForPauri } from '../scoring/client';
import { BANI } from '../scoring/config';
import { encodeWav16 } from '../scoring/dsp/wav';
import { Resampler } from '../scoring/dsp/resample';
import type { ServiceFollowResponse, WordState } from '../scoring/types';
import { useRecordedRecitation, wordIndexMap } from './recordedRecitation';
import { useWebAudioStream } from './webAudioStream';

const SAMPLE_RATE = 16000;
/** One follow every 2 s; a tick is skipped while the previous one is in flight. */
const FOLLOW_INTERVAL_MS = 2000;
/** Under a second there is nothing to place. */
const MIN_FOLLOW_SAMPLES = SAMPLE_RATE;

export type LiveWord = { lineIndex: number; wordIndex: number; state: WordState };
export type LiveFollow = {
  /** Reached words only; an absent word is still pending. Indexes are on-screen. */
  words: LiveWord[];
  reached: { lineIndex: number; wordIndex: number } | null;
};

const EMPTY: LiveFollow = { words: [], reached: null };

/** Service seq/idx -> the on-screen line and word, matched by each word's Gurmukhi. */
function toLive(body: ServiceFollowResponse, pauri: Pauri, seqs: number[]): LiveFollow {
  const lineOf = new Map(seqs.map((seq, i) => [seq, i]));
  const maps = new Map<number, Map<number, number>>();
  const words: LiveWord[] = [];
  for (const line of body.lines ?? []) {
    const lineIndex = lineOf.get(Number(line.seq));
    const text = lineIndex === undefined ? undefined : pauri.lines[lineIndex]?.text;
    if (lineIndex === undefined || text === undefined) continue;
    const map = wordIndexMap(text, line);
    maps.set(lineIndex, map);
    for (const w of line.words ?? []) {
      if (w.state === 'pending') continue;
      words.push({ lineIndex, wordIndex: map.get(w.idx) ?? w.idx, state: w.state });
    }
  }
  const at = body.reached ? lineOf.get(Number(body.reached.seq)) : undefined;
  const reached =
    body.reached && at !== undefined
      ? { lineIndex: at, wordIndex: maps.get(at)?.get(body.reached.idx) ?? body.reached.idx }
      : null;
  return { words, reached };
}

export function useFollowedRecitation(pauris: Pauri[]) {
  const recorded = useRecordedRecitation(pauris);
  const [live, setLive] = useState<LiveFollow>(EMPTY);
  // Cleared if the stream will not start here, so the screen shows a plain recording.
  const [streamWorks, setStreamWorks] = useState(true);

  const activeRef = useRef(false);
  /** Bumped on every start and stop, so a late answer cannot land on a new attempt. */
  const generationRef = useRef(0);
  const chunksRef = useRef<Float32Array[]>([]);
  const resamplerRef = useRef<Resampler | null>(null);
  const inFlightRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef<{ pauri: Pauri; seqs: number[] } | null>(null);
  const reciterRef = useRef(recorded.reciter);
  reciterRef.current = recorded.reciter;

  const onBuffer = useCallback((buffer: AudioStreamBuffer) => {
    if (!activeRef.current) return;
    const incoming = new Float32Array(buffer.data);
    resamplerRef.current ??= new Resampler(buffer.sampleRate, SAMPLE_RATE);
    // Passthrough hands back the input view, and a native buffer may be reused.
    const samples = resamplerRef.current.push(incoming).slice();
    if (samples.length) chunksRef.current.push(samples);
  }, []);

  const isWeb = Platform.OS === 'web';
  // As in liveRecitation: expo-audio's web stream is a stub, so both hooks run and one is wired.
  const native = useAudioStream({
    sampleRate: SAMPLE_RATE,
    channels: 1,
    encoding: 'float32',
    onBuffer: isWeb ? undefined : onBuffer,
  });
  const web = useWebAudioStream(isWeb ? { sampleRate: SAMPLE_RATE, onBuffer } : null);
  const stream = isWeb ? web.stream : native.stream;
  const streamRef = useRef(stream);
  streamRef.current = stream;

  const follow = useCallback(async () => {
    const target = targetRef.current;
    if (!activeRef.current || inFlightRef.current || !target) return;
    const chunks = chunksRef.current.slice();
    if (chunks.reduce((n, c) => n + c.length, 0) < MIN_FOLLOW_SAMPLES) return;

    const generation = generationRef.current;
    const controller = new AbortController();
    inFlightRef.current = controller;
    try {
      const body = await followRecording(encodeWav16(chunks, SAMPLE_RATE), {
        bani: BANI,
        reciter: reciterRef.current,
        seqs: target.seqs,
        signal: controller.signal,
      });
      if (generation !== generationRef.current || !body) return;
      // Unclear so far: keep what is already on screen.
      if (body.status === 'ok') setLive(toLive(body, target.pauri, target.seqs));
    } catch {
      // The endpoint is missing: stop asking for this attempt.
      if (generation === generationRef.current && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } finally {
      if (inFlightRef.current === controller) inFlightRef.current = null;
    }
  }, []);

  const halt = useCallback(() => {
    activeRef.current = false;
    generationRef.current++;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    inFlightRef.current?.abort();
    inFlightRef.current = null;
    try {
      streamRef.current?.stop();
    } catch {
      // Not running.
    }
  }, []);

  const recordedStart = recorded.start;
  const start = useCallback(
    async (pauriNumber: number) => {
      halt();
      setLive(EMPTY);
      chunksRef.current = [];
      resamplerRef.current = null;
      // The file recorder first: the final score must not depend on the stream.
      if (!(await recordedStart(pauriNumber))) return false;

      const pauri = pauris.find(p => p.number === pauriNumber);
      if (!stream || !pauri) return true;
      targetRef.current = { pauri, seqs: seqsForPauri(pauris, pauriNumber) };
      try {
        activeRef.current = true;
        await stream.start();
        timerRef.current = setInterval(() => void follow(), FOLLOW_INTERVAL_MS);
      } catch {
        // No live stream here: carry on as a plain recording.
        activeRef.current = false;
        setStreamWorks(false);
      }
      return true;
    },
    [halt, recordedStart, pauris, stream, follow],
  );

  const recordedStop = recorded.stop;
  const stop = useCallback(async () => {
    // Close the stream before the recorder switches the audio mode back.
    halt();
    setLive(EMPTY);
    return recordedStop();
  }, [halt, recordedStop]);

  // Never leave the microphone or a request open behind us.
  const haltRef = useRef(halt);
  haltRef.current = halt;
  useEffect(() => () => haltRef.current(), []);

  return {
    ...recorded,
    start,
    stop,
    currentLine: live.reached?.lineIndex ?? 0,
    live: stream && streamWorks ? live : undefined,
  };
}
