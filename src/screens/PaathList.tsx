/**
 * Full paath view — the whole bani scrolling, every word tappable.
 */

import { useEffect, useState } from 'react';
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

export default function PaathList({ baniId, rehat = 'sgpc', baseUrl }: Props) {
  const { paath, loading, error, reload } = useBani(baniId, { rehat, baseUrl });

  // Tapped words, keyed `${verseId}:${wordIndex}` so lines stay independent.
  const [tapped, setTapped] = useState<Record<string, true>>({});

  useEffect(() => setTapped({}), [baniId, rehat]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>Loading paath…</Text>
      </View>
    );
  }

  if (error || !paath) {
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

  const tappedCount = Object.keys(tapped).length;

  const toggleWord = (key: string) =>
    setTapped(prev => {
      if (prev[key]) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: true };
    });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{paath.title}</Text>
        <Text style={styles.subtitle}>
          {paath.writer} · {paath.source}
        </Text>
        <Text style={styles.meta}>
          {paath.lines.length} lines · {tappedCount}{' '}
          {tappedCount === 1 ? 'word' : 'words'} tapped
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {paath.lines.map(line => (
          <Line
            key={line.verseId}
            line={line}
            tapped={tapped}
            onToggle={toggleWord}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Line({
  line,
  tapped,
  onToggle,
}: {
  line: PaathLine;
  tapped: Record<string, true>;
  onToggle: (key: string) => void;
}) {
  // headingLevel is a styling hint only — headings here are recited too.
  const isHeading = line.headingLevel !== null;

  return (
    <View style={[styles.line, isHeading && styles.headingLine]}>
      <View style={styles.words}>
        {line.words.map((word, index) => {
          const key = `${line.verseId}:${index}`;
          return (
            <Pressable key={key} onPress={() => onToggle(key)}>
              <Text
                style={[
                  styles.word,
                  isHeading && styles.headingWord,
                  tapped[key] && styles.wordTapped,
                ]}
              >
                {word}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!isHeading && (
        <>
          <Text style={styles.translit}>{line.transliteration}</Text>
          <Text style={styles.ipa}>{line.ipa}</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 4, fontSize: 14, color: colors.muted },
  meta: { marginTop: 8, fontSize: 12, color: colors.faint },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 64, gap: 20 },
  line: { gap: 6 },
  headingLine: { alignItems: 'center', marginVertical: 8 },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  word: { fontSize: 22, lineHeight: 36, color: colors.text },
  headingWord: { fontSize: 24, fontWeight: '700', color: colors.accent },
  wordTapped: {
    color: '#fff',
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  translit: { fontSize: 14, color: colors.muted, fontStyle: 'italic' },
  ipa: { fontSize: 12, color: colors.faint },
});
