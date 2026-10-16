/**
 * Playing one pauri or one line out of a full-bani recording.
 *
 * The ustaad recordings are a single track per bani, so "play this pauri"
 * means seek to its start and stop at its end. expo-audio has no native
 * play-a-range, so the stop is driven by playback position updates.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

import type { AudioRange } from './timings';

/**
 * How often playback position is reported, in ms. This is also the worst-case
 * overshoot past a range's end, so it has to stay well under the shortest
 * line — some are under 100ms.
 */
const UPDATE_INTERVAL_MS = 25;

/**
 * Seek tolerance in ms. AVPlayer seeks to the nearest keyframe by default,
 * which can be whole seconds away; lines this short need an exact seek even
 * though it costs a little latency.
 */
const SEEK_TOLERANCE_MS = 0;

export interface RangePlayer {
  /** Play exactly this slice of the track, stopping at its end. */
  playRange: (range: AudioRange) => Promise<void>;
  stop: () => void;
  /** True while a range is playing. */
  playing: boolean;
  /** True while the track is still loading or buffering. */
  loading: boolean;
  /** 0-1 through the current range, or null when nothing is playing. */
  progress: number | null;
  error: string | null;
}

/**
 * A player bound to one track, able to play arbitrary ranges of it.
 *
 * Pass null while no track is known — the hook still has to run, so it cannot
 * be called conditionally.
 */
export function useRangePlayer(trackUrl: string | null): RangePlayer {
  const player = useAudioPlayer(trackUrl, {
    updateInterval: UPDATE_INTERVAL_MS,
  });
  const status = useAudioPlayerStatus(player);

  const [range, setRange] = useState<AudioRange | null>(null);
  // Held in a ref as well so the stop check never reads a stale range.
  const rangeRef = useRef<AudioRange | null>(null);

  // Gurbani should still play when the phone's ringer switch is silenced.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
      // Not fatal: audio still plays when the device isn't on silent.
    });
  }, []);

  const stop = useCallback(() => {
    rangeRef.current = null;
    setRange(null);
    player.pause();
  }, [player]);

  const playRange = useCallback(
    async (next: AudioRange) => {
      rangeRef.current = next;
      setRange(next);
      await player.seekTo(next.start, SEEK_TOLERANCE_MS, SEEK_TOLERANCE_MS);
      player.play();
    },
    [player],
  );

  // Stop at the range's end. Driven by reported position rather than a timer,
  // so buffering delays push the stop later instead of truncating the line.
  useEffect(() => {
    const active = rangeRef.current;
    if (!active || !status.playing) return;
    if (status.currentTime < active.end) return;

    rangeRef.current = null;
    setRange(null);
    player.pause();
  }, [status.playing, status.currentTime, player]);

  // Releasing the screen should not leave the ustaad reciting.
  useEffect(() => () => player.pause(), [player]);

  const progress =
    range && status.playing
      ? Math.min(
          1,
          Math.max(0, (status.currentTime - range.start) / (range.end - range.start)),
        )
      : null;

  return {
    playRange,
    stop,
    playing: Boolean(range) && status.playing,
    loading: !status.isLoaded || status.isBuffering,
    progress,
    error: status.error,
  };
}
