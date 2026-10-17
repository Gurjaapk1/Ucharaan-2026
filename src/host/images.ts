/**
 * Bundled artwork.
 *
 * The web prototype served these over HTTP from /assets. Metro needs static
 * require() calls it can resolve at build time, so the mapping is explicit.
 */

import type { ImageSourcePropType } from 'react-native';

const IMAGES: Record<string, ImageSourcePropType> = {
  'journey-calm.jpg': require('../../assets/app/journey-calm.jpg'),
  'pauri-1-calm.jpg': require('../../assets/app/pauri-1-calm.jpg'),
  'khalislogo150.png': require('../../assets/app/khalislogo150.png'),
  'prem-character.png': require('../../assets/app/prem-character.png'),
  'sehaj-character.png': require('../../assets/app/sehaj-character.png'),
  'pauri-1-story-panorama.png': require('../../assets/app/pauri-1-story-panorama.png'),
};

/** Resolve a filename to a bundled asset; unknown names render nothing. */
export function image(file: string): ImageSourcePropType {
  return IMAGES[file] ?? IMAGES['journey-calm.jpg'];
}
