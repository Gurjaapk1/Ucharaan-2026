/**
 * Uchaaran Helper — native shell.
 *
 * KidsMode is the prototype's app, unchanged: it was already written against
 * React Native primitives and takes every platform difference through the
 * `HostPorts` seam. This file supplies the native side of that seam —
 * ScrollViews, a modal sheet, bundled images, device storage, safe-area
 * insets and expo-audio — in place of the browser implementations.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';

import KidsApp from './src/KidsMode/KidsApp';
import {
  freshExperience,
  parseExperience,
  type Experience,
} from './src/KidsMode/experience';
import type { HostPorts, Pauri } from './src/KidsMode/types';
import pauris from './src/bani.json';
import { useClipPlayer, useReferenceAudio } from './src/host/audio';
import { Icon } from './src/host/icons';
import { image } from './src/host/images';
import { HorizontalScroll, Scroll, Sheet } from './src/host/layout';
import { useLiveRecitation } from './src/host/liveRecitation';
import { useRecordedRecitation } from './src/host/recordedRecitation';
import { USE_SERVICE } from './src/scoring/config';
import { toReviewedLines } from './src/scoring/align';
import type { ReviewedLine } from './src/KidsMode/wordFeedback';

const STORAGE_KEY = 'uchaaran-experience-v1';

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

function Shell() {
  const insets = useSafeAreaInsets();

  // The prototype declared these with CSS @font-face, which React Native has
  // no equivalent for. GurbaniAkharTrue in particular is ASCII-mapped — without
  // it the Gurmukhi headings render as raw Latin characters.
  const [fontsLoaded] = useFonts({
    'BalooPaaji2-Regular': require('./assets/fonts/BalooPaaji2-Regular.ttf'),
    'BalooPaaji2-SemiBold': require('./assets/fonts/BalooPaaji2-SemiBold.ttf'),
    GurbaniAkharTrue: require('./assets/fonts/GurbaniAkharTrue.ttf'),
  });
  const audio = useReferenceAudio();
  const clip = useClipPlayer();
  const recitation = useRecitationPort();

  // HostPorts.storage.load() is synchronous, but device storage is not.
  // Hydrate first, then render KidsApp with the value already in hand.
  const [saved, setSaved] = useState<Experience | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!active) return;
        try {
          setSaved(parseExperience(JSON.parse(raw ?? 'null')) ?? freshExperience());
        } catch {
          setSaved(freshExperience());
        }
      })
      .catch(() => active && setSaved(freshExperience()));
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback((value: Experience) => {
    // Fire and forget: the port is synchronous, and a failed write only costs
    // this session's progress.
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value)).catch(() => {});
    return true;
  }, []);

  const host = useMemo<HostPorts | null>(() => {
    if (!saved) return null;
    return {
      Sheet,
      Scroll,
      HorizontalScroll,
      Icon,
      image,
      storage: { load: () => saved, save },
      audio,
      clip,
      recitation,
      statusBarBackground: '#ffffff',
      safeArea: { top: insets.top, bottom: insets.bottom },
    };
  }, [saved, save, audio, clip, recitation, insets.top, insets.bottom]);

  if (!host || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <KidsApp pauris={pauris as Pauri[]} host={host} />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf9f6',
  },
});

/** The service's recorder, or Gurjaap's on-device scorer as the offline fallback. */
function useServiceRecitation() {
  return useRecordedRecitation(pauris as Pauri[]);
}
// A module constant, so the same hooks run on every render.
const useRecitationPort = USE_SERVICE ? useServiceRecitation : useRecitation;

/**
 * The live-recitation port.
 *
 * Absent on web, which has no microphone stream — the app then keeps its
 * simulated challenge rather than pretending to listen.
 */
function useRecitation() {
  const live = useLiveRecitation();
  const pauriRef = useRef<number | null>(null);

  const start = useCallback(
    async (pauriNumber: number, lineCount: number) => {
      pauriRef.current = pauriNumber;
      return live.start(pauriNumber, lineCount);
    },
    [live],
  );

  const stop = useCallback(async (): Promise<{
    review: ReviewedLine[];
    score: number;
  } | null> => {
    const results = await live.stop();
    const pauriNumber = pauriRef.current;
    if (pauriNumber === null) return null;

    const pauri = (pauris as Pauri[]).find(p => p.number === pauriNumber);
    if (!pauri || results.length === 0) return null;

    // Lines the child never reached stay unscored rather than counting as zero.
    const byLine = new Map(results.map(r => [r.lineIndex, r.score]));
    const scored = pauri.lines.map((_, i) => byLine.get(i));
    const heard = scored.filter((s): s is number => s !== undefined);

    // A line the microphone never segmented was not scored badly — it was not
    // heard at all. Showing it as 0% tells the child they failed something
    // that was never measured, so unheard lines inherit the heard average.
    const average = heard.length
      ? Math.round(heard.reduce((n, s) => n + s, 0) / heard.length)
      : 0;
    const review = toReviewedLines(pauri.lines, {
      lineScores: pauri.lines.map((_, i) => byLine.get(i) ?? average),
      words: [],
      provider: 'on-device',
    });
    return { review, score: average };
  }, [live]);

  // No stream, no honest scoring — fall back to the simulated challenge.
  if (!live.supported) return undefined;

  return {
    granted: live.granted,
    requestPermission: live.requestPermission,
    start,
    stop,
    isRecording: live.isStreaming,
    level: live.level,
    currentLine: live.currentLine,
    lineScores: live.results.map(r => ({ lineIndex: r.lineIndex, score: r.score })),
    error: live.error,
  };
}
