import { useCallback, useEffect, useRef, useState } from "react";
import TrackPlayer, { useProgress } from "react-native-track-player";
import {
  addTrack,
  pauseTrack,
  playTrack,
  resetPlayer,
  TrackPlayerSetup,
} from "@common/TrackPlayerUtils";
import { logError } from "@common";

// Plays one stretch of a track on the app's shared player and stops at its end.
const useKidsAudio = () => {
  const { position } = useProgress(100);
  const [range, setRange] = useState(null);
  // The player reports its old position for a moment after a seek; wait to see the new one.
  const reached = useRef(false);

  const stop = useCallback(() => {
    setRange(null);
    return pauseTrack();
  }, []);

  const play = useCallback(async (track, start = 0, end = Infinity) => {
    try {
      reached.current = false;
      await TrackPlayerSetup();
      await resetPlayer();
      await addTrack(track);
      await TrackPlayer.seekTo(start);
      await playTrack();
      setRange({ start, end });
    } catch (error) {
      logError(error);
      setRange(null);
    }
  }, []);

  useEffect(() => {
    if (!range) return;
    if (position >= range.start && position < range.end) reached.current = true;
    else if (reached.current && position >= range.end) stop();
  }, [range, position, stop]);

  useEffect(() => () => pauseTrack(), []);

  return { playing: range !== null, position, play, stop };
};

export default useKidsAudio;
