/**
 * Reference-audio playback.
 *
 * The ustaad recording is one long track per bani, so "hear this line" means
 * seek to its start and stop at its end. The web prototype did this with an
 * <audio> element and a timeupdate handler; expo-audio has no native
 * play-a-range either, so the stop is driven by reported position.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
} from 'expo-audio';

/** Japji Sahib, recited by Bhai Jarnail Singh — the prototype's reference. */
export const REFERENCE_AUDIO =
  'https://gurbani-audios-c4abhzghhnccd5gj.z01.azurefd.net/audios/BhaiJarnailSingh/JapjiSahib.m4a';

/**
 * Position is reported this often, which is also the worst-case overshoot
 * past a line's end. Lines run well under a second, so it has to stay small.
 */
const UPDATE_INTERVAL_MS = 25;

/** Seek to the exact time rather than the nearest keyframe, which can be seconds off. */
const SEEK_TOLERANCE_MS = 0;

export interface AudioPort {
  playing: boolean;
  error: string;
  listen: (start: number, end: number, rate?: number) => void;
  stop: () => void;
}

export function useReferenceAudio(trackUrl: string = REFERENCE_AUDIO): AudioPort {
  const player = useAudioPlayer(trackUrl, { updateInterval: UPDATE_INTERVAL_MS });
  const status = useAudioPlayerStatus(player);

  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<number | null>(null);

  // Gurbani should still play when the ringer switch is silenced.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
      // Not fatal: audio still plays unless the device is on silent.
    });
  }, []);

  const stop = useCallback(() => {
    endRef.current = null;
    setPlaying(false);
    setError('');
    player.pause();
  }, [player]);

  const listen = useCallback(
    (start: number, end: number, rate = 1) => {
      setError('');
      endRef.current = end;
      player.pause();

      // Claim the session for playback every time, not just once at mount.
      // Recording leaves iOS in a play-and-record category that routes audio
      // to the earpiece, so playback appears to start — the control even flips
      // to "Pause reference" — while nothing is audible.
      setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
        .catch(() => {
          // Not fatal on its own; the seek below still decides the outcome.
        })
        .then(() => player.seekTo(start, SEEK_TOLERANCE_MS, SEEK_TOLERANCE_MS))
        .then(() => {
          player.setPlaybackRate(rate);
          player.play();
          setPlaying(true);
        })
        .catch(() => {
          endRef.current = null;
          setPlaying(false);
          setError('Audio could not load. Please try again.');
        });
    },
    [player],
  );

  // Stop at the line's end. Driven by reported position rather than a timer,
  // so buffering pushes the stop later instead of truncating the line.
  useEffect(() => {
    const end = endRef.current;
    if (end === null || !status.playing) return;
    if (status.currentTime < end) return;

    endRef.current = null;
    setPlaying(false);
    player.pause();
  }, [status.playing, status.currentTime, player]);

  // Surface load failures the way the prototype did.
  useEffect(() => {
    if (status.error) {
      setError('Reference audio is currently unavailable.');
      setPlaying(false);
    }
  }, [status.error]);

  // Leaving the screen should not leave the ustaad reciting.
  useEffect(() => () => player.pause(), [player]);

  return { playing, error, listen, stop };
}

/**
 * Word clips from the scoring service. A second player, because the reference
 * port above only seeks within the one Bhai Jarnail Singh track.
 */
export function useClipPlayer() {
  const player: AudioPlayer = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState('');

  const play = useCallback(
    (url: string) => {
      setError('');
      try {
        player.replace({ uri: url });
        player.play();
      } catch {
        setError('This word\u2019s recording is unavailable.');
      }
    },
    [player],
  );
  const stop = useCallback(() => player.pause(), [player]);

  useEffect(() => {
    if (status.error) setError('This word\u2019s recording is unavailable.');
  }, [status.error]);

  return { playing: status.playing, error, play, stop };
}
