/**
 * Line-by-line paath reader.
 *
 * Shows one line at a time so a child can work through a bani at their own
 * pace. Words stay individually tappable, and each line carries its
 * transliteration, IPA and translation underneath.
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

import { useBani, type PaathLine, type Rehat } from '../api/bani';
import { colors } from '../theme';

interface Props {
  baniId: number;
  rehat?: Rehat;
  /** Point at a local banidb-api instead of the hosted one. */
  baseUrl?: string;
}

export default function LineByLine({ baniId, rehat = 'sgpc', baseUrl }: Props) {
  const { paath, loading, error, reload } = useBani(baniId, { rehat, baseUrl });

  const [index, setIndex] = useState(0);
  const [tapped, setTapped] = useState<Record<number, true>>({});
  const [larivaar, setLarivaar] = useState(false);

  // Switching bani must not leave us parked on a line the new one lacks.
  useEffect(() => {
    setIndex(0);
    setTapped({});
  }, [baniId, rehat]);

  const line: PaathLine | undefined = paath?.lines[index];

  // Ang changes are worth surfacing; recompute only when the line moves.
  const position = useMemo(() => {
    if (!paath || !line) return '';
    return `Line ${index + 1} of ${paath.lines.length} · Ang ${line.pageNo}`;
  }, [paath, line, index]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>Loading paath…</Text>
      </View>
    );
  }

  if (error || !paath || !line) {
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

  const atStart = index === 0;
  const atEnd = index === paath.lines.length - 1;

  const toggleWord = (wordIndex: number) =>
    setTapped(prev => {
      if (prev[wordIndex]) {
        const { [wordIndex]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [wordIndex]: true };
    });

  const step = (delta: number) => {
    setIndex(current => {
      const next = Math.min(Math.max(current + delta, 0), paath.lines.length - 1);
      if (next !== current) setTapped({});
      return next;
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{paath.title}</Text>
        <Text style={styles.position}>{position}</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((index + 1) / paath.lines.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {larivaar ? (
          <Text style={styles.larivaar}>{line.larivaar}</Text>
        ) : (
          <View style={styles.words}>
            {line.words.map((word, wordIndex) => (
              <Pressable
                key={`${line.verseId}:${wordIndex}`}
                onPress={() => toggleWord(wordIndex)}
              >
                <Text
                  style={[styles.word, tapped[wordIndex] && styles.wordTapped]}
                >
                  {word}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.translit}>{line.transliteration}</Text>
        <Text style={styles.ipa}>{line.ipa}</Text>
        {line.translation !== '' && (
          <Text style={styles.translation}>{line.translation}</Text>
        )}
      </ScrollView>

      <View style={styles.controls}>
        <Pressable
          style={[styles.navButton, atStart && styles.navButtonDisabled]}
          disabled={atStart}
          onPress={() => step(-1)}
        >
          <Text style={[styles.navLabel, atStart && styles.navLabelDisabled]}>
            ‹ Previous
          </Text>
        </Pressable>

        <Pressable
          style={styles.larivaarToggle}
          onPress={() => setLarivaar(value => !value)}
        >
          <Text style={styles.larivaarLabel}>
            {larivaar ? 'Padh chhedh' : 'Larivaar'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.navButton, atEnd && styles.navButtonDisabled]}
          disabled={atEnd}
          onPress={() => step(1)}
        >
          <Text style={[styles.navLabel, atEnd && styles.navLabelDisabled]}>
            Next ›
          </Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  word: { fontSize: 34, lineHeight: 56, color: colors.text },
  wordTapped: {
    color: '#fff',
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  larivaar: {
    fontSize: 32,
    lineHeight: 54,
    color: colors.text,
    textAlign: 'center',
  },
  translit: {
    fontSize: 17,
    color: colors.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  ipa: { fontSize: 14, color: colors.faint, textAlign: 'center' },
  translation: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  navButtonDisabled: { backgroundColor: 'transparent' },
  navLabel: { fontSize: 16, fontWeight: '600', color: colors.accent },
  navLabelDisabled: { color: colors.faint },
  larivaarToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  larivaarLabel: { fontSize: 12, color: colors.muted },
});
