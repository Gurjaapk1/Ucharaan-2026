/**
 * Live microphone capture on the web.
 *
 * expo-audio ships a stub for web — `useAudioStream` there returns a null
 * stream — so the browser gets no live audio from it. This supplies the same
 * contract (start/stop plus `onBuffer` callbacks carrying PCM) backed by
 * getUserMedia, so the challenge behaves the same way in a browser as on a
 * device and the scoring path can be exercised without a native build.
 *
 * No audio leaves the page: buffers go straight to the feature extractor.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AudioStreamBuffer } from 'expo-audio';

export interface WebAudioStream {
  start: () => Promise<void>;
  stop: () => void;
}

export interface WebAudioStreamResult {
  stream: WebAudioStream | null;
  isStreaming: boolean;
}

export interface WebAudioStreamOptions {
  sampleRate: number;
  onBuffer: (buffer: AudioStreamBuffer) => void;
}

/** Buffer size in frames. 2048 at 16 kHz is ~128ms — small enough to feel live. */
const BUFFER_FRAMES = 2048;

function audioContextAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    Boolean(window.AudioContext ?? (window as any).webkitAudioContext)
  );
}

/** Prompt for microphone access, releasing the track immediately after. */
export async function requestWebMicrophone(): Promise<boolean> {
  if (!audioContextAvailable()) return false;
  try {
    const media = await navigator.mediaDevices.getUserMedia({ audio: true });
    media.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}

export function useWebAudioStream(
  options: WebAudioStreamOptions | null,
): WebAudioStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);

  const contextRef = useRef<AudioContext | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  /**
   * The muted sink must be retained. A ScriptProcessor only runs while its
   * output reaches the destination, and the browser collects audio nodes that
   * JavaScript no longer references — so letting this fall out of scope
   * silently stops the callbacks while the graph still looks connected.
   */
  const sinkRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const startedAtRef = useRef(0);

  // Held in a ref so the audio callback always sees the current handler
  // without tearing down and rebuilding the graph on every render.
  const onBufferRef = useRef(options?.onBuffer);
  onBufferRef.current = options?.onBuffer;
  // Options arrive as a fresh object each render. Reading them through a ref
  // keeps `start` stable, which keeps the returned stream stable, which stops
  // consumers' effects from tearing the microphone down on every render.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const stop = useCallback(() => {
    console.log('[web-audio] stop() called', new Error().stack?.split('\n').slice(1,5).join(' | '));
    nodeRef.current?.disconnect();
    sinkRef.current?.disconnect();
    sourceRef.current?.disconnect();
    mediaRef.current?.getTracks().forEach(track => track.stop());
    void contextRef.current?.close().catch(() => {});
    nodeRef.current = null;
    sinkRef.current = null;
    sourceRef.current = null;
    mediaRef.current = null;
    contextRef.current = null;
    setIsStreaming(false);
  }, []);

  const start = useCallback(async () => {
    const current = optionsRef.current;
    if (!current || !audioContextAvailable()) {
      throw new Error('This browser cannot capture audio');
    }
    // Already capturing: leave the running graph alone.
    if (contextRef.current) {
      console.log('[web-audio] start ignored: already running');
      return;
    }

    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        // The reference features assume clean, unprocessed speech; browser
        // voice processing would alter the spectrum being compared.
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    mediaRef.current = media;

    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as any).webkitAudioContext;
    // Asking for the reference rate avoids resampling; browsers may ignore it,
    // which is why the real rate is reported on every buffer.
    const context = new Ctor({ sampleRate: current.sampleRate });
    contextRef.current = context;
    await context.resume();

    const source = context.createMediaStreamSource(media);
    sourceRef.current = source;

    // ScriptProcessor is deprecated in favour of AudioWorklet, but a worklet
    // needs a separately served module and this runs on the main thread only
    // to copy samples — the heavy work happens downstream.
    const node = context.createScriptProcessor(BUFFER_FRAMES, 1, 1);
    nodeRef.current = node;
    startedAtRef.current = context.currentTime;

    let fired = 0;
    node.onaudioprocess = event => {
      if (++fired <= 2 || fired % 40 === 0) {
        console.log('[web-audio] onaudioprocess', fired, 'rate', context.sampleRate);
      }
      const input = event.inputBuffer.getChannelData(0);
      // The node reuses its buffer, so hand on a copy.
      const copy = new Float32Array(input.length);
      copy.set(input);
      onBufferRef.current?.({
        data: copy.buffer,
        sampleRate: context.sampleRate,
        channels: 1,
        timestamp: context.currentTime - startedAtRef.current,
      });
    };

    source.connect(node);
    // Routing through a muted gain keeps the processor running without
    // echoing the child's voice back at them.
    const sink = context.createGain();
    sink.gain.value = 0;
    sinkRef.current = sink;
    node.connect(sink);
    sink.connect(context.destination);

    console.log('[web-audio] graph connected, ctx rate', context.sampleRate, 'state', context.state);
    setIsStreaming(true);
  }, []);

  // Teardown must happen on unmount and nowhere else. Depending on `stop`'s
  // identity meant any change to it re-ran the cleanup, closing the
  // microphone moments after it opened — the graph looked connected while no
  // audio callbacks ever arrived.
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => () => stopRef.current(), []);

  // One stable object for the lifetime of the hook.
  const api = useMemo<WebAudioStream>(() => ({ start, stop }), [start, stop]);

  if (!audioContextAvailable()) return { stream: null, isStreaming: false };
  return { stream: api, isStreaming };
}
