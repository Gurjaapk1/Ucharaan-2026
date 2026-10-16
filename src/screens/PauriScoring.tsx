/**
 * Pauri-by-pauri practice.
 *
 * Works through one pauri at a time. Inside a pauri the child takes one line
 * at a time and each line gets a mark; when the last line is marked the pauri
 * closes with a summary and a "Next pauri" button.
 *
 * The marks here are entered by hand. Real uchaaran scoring — listening to the
 * child and comparing against the ustaad's recording — is not wired up yet;
 * this is the flow and the per-line result shape it will fill in. Swap the two
 * buttons for the scorer's verdict and nothing else here has to change.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useBani, type Rehat } from '../api/bani';
import { groupIntoPauris, pauriAccuracy, type LineScore } from '../api/pauris';
import {
  goToNextPauri,
  initialPracticeState,
  isPauriComplete,
  redoPauri as redoPauriState,
  scoreLine,
} from '../api/practice';
import { useRangePlayer } from '../audio/player';
import {
  buildAudioIndex,
  lineAudioRange,
  pauriAudioRange,
  recitersForBani,
  type AudioIndex,
} from '../audio/timings';
import { colors } from '../theme';

interface Props {
  baniId: number;
  rehat?: Rehat;
  baseUrl?: string;
}

export default function PauriScoring({ baniId, rehat = 'sgpc', baseUrl }: Props) {
  const { paath, loading, error, reload } = useBani(baniId, { rehat, baseUrl });

  const [state, setState] = useState(initialPracticeState);

  const pauris = useMemo(
    () => (paath ? groupIntoPauris(paath.lines) : []),
    [paath],
  );

  // The first reciter with bundled timings for this bani, if any.
  const reciter = recitersForBani(baniId)[0] ?? null;

  // A bad pairing must not take the whole screen down — practice still works
  // without audio, so fall back to silent rather than throwing.
  const audio = useMemo<AudioIndex | null>(() => {
    if (!paath || !reciter) return null;
    try {
      return buildAudioIndex(paath, reciter);
    } catch (caught) {
      console.warn('[uchaaran] audio unavailable:', (caught as Error).message);
      return null;
    }
  }, [paath, reciter]);

  const audioPlayer = useRangePlayer(audio?.trackUrl ?? null);

  // A different bani means different pauris; don't keep stale positions.
  useEffect(() => setState(initialPracticeState), [baniId, rehat]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>Loading paath…</Text>
      </View>
    );
  }

  if (error || !paath || pauris.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Could not load the paath</Text>
        <Text style={styles.muted}>{error?.message ?? 'Unknown error'}</Text>
        <Pressable style={styles.retry} onPress={reload}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const { pauriIndex, lineIndex } = state;
  const pauri = pauris[pauriIndex];
  const result = state.results[pauriIndex] ?? { pauriIndex, scores: {} };
  const pauriDone = isPauriComplete(pauris, state);
  const isLastPauri = pauriIndex === pauris.length - 1;
  const line = pauri.lines[Math.min(lineIndex, pauri.lines.length - 1)];

  const score = (mark: LineScore) => {
    audioPlayer.stop();
    setState(current => scoreLine(pauris, current, mark));
  };
  const nextPauri = () => {
    audioPlayer.stop();
    setState(current => goToNextPauri(pauris, current));
  };
  const redoPauri = () => setState(redoPauriState);

  const accuracy = pauriAccuracy(result);
  const toPractise = pauri.lines.filter(
    candidate => result.scores[candidate.verseId] === 'practise',
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{paath.title}</Text>
        <Text style={styles.position}>
          {pauri.label} · {pauriIndex + 1} of {pauris.length}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((pauriIndex + 1) / pauris.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {pauriDone ? (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.summaryHeading}>Pauri complete</Text>
          <Text style={styles.summaryScore}>
            {accuracy === null ? '—' : `${Math.round(accuracy * 100)}%`}
          </Text>
          <Text style={styles.muted}>
            {pauri.lines.length - toPractise.length} of {pauri.lines.length}{' '}
            {pauri.lines.length === 1 ? 'line' : 'lines'} said well
          </Text>

          {toPractise.length > 0 && (
            <View style={styles.practiseBox}>
              <Text style={styles.practiseHeading}>Practise again</Text>
              {toPractise.map(item => (
                <Text key={item.verseId} style={styles.practiseLine}>
                  {item.gurmukhi}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.summaryActions}>
            <Pressable style={styles.secondaryButton} onPress={redoPauri}>
              <Text style={styles.secondaryLabel}>Redo this pauri</Text>
            </Pressable>
            {!isLastPauri && (
              <Pressable style={styles.primaryButton} onPress={nextPauri}>
                <Text style={styles.primaryLabel}>Next pauri ›</Text>
              </Pressable>
            )}
          </View>

          {isLastPauri && (
            <Text style={styles.muted}>That is the end of this bani.</Text>
          )}
        </ScrollView>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.lineCounter}>
              Line {Math.min(lineIndex + 1, pauri.lines.length)} of{' '}
              {pauri.lines.length}
            </Text>
            <View style={styles.words}>
              {line.words.map((word, index) => (
                <Text key={`${line.verseId}:${index}`} style={styles.word}>
                  {word}
                </Text>
              ))}
            </View>
            <Text style={styles.translit}>{line.transliteration}</Text>
            <Text style={styles.ipa}>{line.ipa}</Text>

            {audio && (
              <View style={styles.listenRow}>
                <Pressable
                  style={styles.listenButton}
                  disabled={audioPlayer.loading}
                  onPress={() => {
                    const range = pauriAudioRange(audio, pauri);
                    if (range) audioPlayer.playRange(range);
                  }}
                >
                  <Text style={styles.listenLabel}>▸ Whole pauri</Text>
                </Pressable>
                <Pressable
                  style={styles.listenButton}
                  disabled={audioPlayer.loading}
                  onPress={() => {
                    const range = lineAudioRange(audio, line);
                    if (range) audioPlayer.playRange(range);
                  }}
                >
                  <Text style={styles.listenLabel}>▸ This line</Text>
                </Pressable>
                {audioPlayer.playing && (
                  <Pressable style={styles.listenButton} onPress={audioPlayer.stop}>
                    <Text style={styles.listenLabel}>■ Stop</Text>
                  </Pressable>
                )}
              </View>
            )}

            {audio && (
              <Text style={styles.reciterNote}>
                {audioPlayer.loading
                  ? 'Loading the recording…'
                  : audioPlayer.error
                    ? `Audio unavailable: ${audioPlayer.error}`
                    : `Recited by ${audio.reciter.name}`}
              </Text>
            )}
          </ScrollView>

          <View style={styles.controls}>
            <Pressable
              style={[styles.markButton, styles.practiseButton]}
              onPress={() => score('practise')}
            >
              <Text style={styles.practiseButtonLabel}>Practise again</Text>
            </Pressable>
            <Pressable
              style={[styles.markButton, styles.goodButton]}
              onPress={() => score('good')}
            >
              <Text style={styles.goodButtonLabel}>Said it well</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: colors.background,
  },
  muted: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  errorTitle: { color: colors.danger, fontSize: 18, fontWeight: '600' },
  retry: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  retryLabel: { color: '#fff', fontWeight: '600' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 6 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  position: { fontSize: 13, color: colors.muted },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: colors.accent },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 14,
  },
  lineCounter: { fontSize: 13, color: colors.faint },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  word: { fontSize: 32, lineHeight: 54, color: colors.text },
  translit: {
    fontSize: 17,
    color: colors.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  ipa: { fontSize: 14, color: colors.faint, textAlign: 'center' },
  listenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  listenButton: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  listenLabel: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  reciterNote: { fontSize: 12, color: colors.faint, textAlign: 'center' },
  summaryHeading: { fontSize: 15, color: colors.muted },
  summaryScore: { fontSize: 56, fontWeight: '700', color: colors.accent },
  practiseBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignSelf: 'stretch',
    gap: 8,
  },
  practiseHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  practiseLine: { fontSize: 20, color: colors.text, textAlign: 'center' },
  summaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  primaryLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryLabel: { color: colors.muted, fontSize: 15 },
  controls: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  markButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  practiseButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  practiseButtonLabel: { color: colors.muted, fontSize: 16, fontWeight: '600' },
  goodButton: { backgroundColor: colors.accent },
  goodButtonLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
