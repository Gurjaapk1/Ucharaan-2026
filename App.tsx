/**
 * Uchaaran Helper.
 *
 * Shell around the two paath views: the whole bani scrolling, or one line at
 * a time. The bani switcher covers both Japji Sahib and Jaap Sahib, which are
 * different banis that are easy to confuse by name.
 */

import { useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { BANI_IDS } from './src/api/bani';
import LineByLine from './src/screens/LineByLine';
import PaathList from './src/screens/PaathList';
import PauriScoring from './src/screens/PauriScoring';
import { colors } from './src/theme';

/**
 * The server comes from EXPO_PUBLIC_BANIDB_API_URL in `.env` (copy
 * `.env.example`); leaving BASE_URL undefined lets `src/api/bani.ts` read that
 * env var itself and raise a clear error if it is unset. Pass a value here
 * only to override it. A phone running Expo Go cannot reach your Mac's
 * localhost — point the env var at the Mac's LAN IP, or at the hosted API.
 */
const BASE_URL: string | undefined = undefined;

const BANIS = [
  { id: BANI_IDS.JAPJI_SAHIB, label: 'Japji Sahib' },
  { id: BANI_IDS.JAAP_SAHIB, label: 'Jaap Sahib' },
] as const;

type Mode = 'pauri' | 'line' | 'full';

export default function App() {
  const [baniId, setBaniId] = useState<number>(BANI_IDS.JAAP_SAHIB);
  const [mode, setMode] = useState<Mode>('pauri');

  return (
    <View style={styles.app}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.switcher}>
        <View style={styles.group}>
          {BANIS.map(bani => (
            <Chip
              key={bani.id}
              label={bani.label}
              active={baniId === bani.id}
              onPress={() => setBaniId(bani.id)}
            />
          ))}
        </View>
        <View style={styles.group}>
          <Chip
            label="Pauri practice"
            active={mode === 'pauri'}
            onPress={() => setMode('pauri')}
          />
          <Chip
            label="Line by line"
            active={mode === 'line'}
            onPress={() => setMode('line')}
          />
          <Chip
            label="Full paath"
            active={mode === 'full'}
            onPress={() => setMode('full')}
          />
        </View>
      </View>

      {mode === 'pauri' && <PauriScoring baniId={baniId} baseUrl={BASE_URL} />}
      {mode === 'line' && <LineByLine baniId={baniId} baseUrl={BASE_URL} />}
      {mode === 'full' && <PaathList baniId={baniId} baseUrl={BASE_URL} />}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  switcher: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  group: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipLabel: { fontSize: 13, color: colors.muted },
  chipLabelActive: { color: '#fff', fontWeight: '600' },
});
