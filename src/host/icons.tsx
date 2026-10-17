/**
 * Icons.
 *
 * The prototype masked lucide SVGs with CSS, which React Native cannot do.
 * Feather carries ten of the eleven names with the same lucide lineage;
 * `coins` is absent from Feather and MaterialCommunityIcons, so it comes from
 * FontAwesome5 instead.
 */

import { FontAwesome5, Feather } from '@expo/vector-icons';

import type { IconName } from '../KidsMode/types';

const FEATHER: Record<Exclude<IconName, 'coins'>, keyof typeof Feather.glyphMap> = {
  settings: 'settings',
  'chevron-left': 'chevron-left',
  home: 'home',
  'book-open': 'book-open',
  map: 'map',
  navigation: 'navigation',
  headphones: 'headphones',
  mic: 'mic',
  'volume-2': 'volume-2',
  star: 'star',
};

export function Icon({
  name,
  color,
  size = 22,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  if (name === 'coins') {
    return <FontAwesome5 name="coins" color={color} size={size * 0.9} />;
  }
  return <Feather name={FEATHER[name]} color={color} size={size} />;
}
