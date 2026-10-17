/**
 * Bundled artwork.
 *
 * The web prototype served these over HTTP from /assets. Metro needs static
 * require() calls it can resolve at build time, so the mapping is explicit.
 */

import type { ImageSourcePropType } from 'react-native';

const IMAGES: Record<string, ImageSourcePropType> = {
  // Journey and character art.
  'journey-calm.jpg': require('../../assets/app/journey-calm.jpg'),
  'pauri-1-calm.jpg': require('../../assets/app/pauri-1-calm.jpg'),
  'khalislogo150.png': require('../../assets/app/khalislogo150.png'),
  'prem-character.png': require('../../assets/app/prem-character.png'),
  'sehaj-character.png': require('../../assets/app/sehaj-character.png'),
  'pauri-1-story-panorama.png': require('../../assets/app/pauri-1-story-panorama.png'),

  // One painted terrain per region of the journey map.
  'regions/fields-calm.jpg': require('../../assets/app/regions/fields-calm.jpg'),
  'regions/grace-calm.jpg': require('../../assets/app/regions/grace-calm.jpg'),
  'regions/horizon-calm.jpg': require('../../assets/app/regions/horizon-calm.jpg'),
  'regions/paths-calm.jpg': require('../../assets/app/regions/paths-calm.jpg'),
  'regions/river-calm.jpg': require('../../assets/app/regions/river-calm.jpg'),
  'regions/wonder-calm.jpg': require('../../assets/app/regions/wonder-calm.jpg'),

  // One painted landscape per pauri, for the memory walk.
  'japji/opening.jpg': require('../../assets/app/japji/opening.jpg'),
  'japji/pauri-02.jpg': require('../../assets/app/japji/pauri-02.jpg'),
  'japji/pauri-03.jpg': require('../../assets/app/japji/pauri-03.jpg'),
  'japji/pauri-04.jpg': require('../../assets/app/japji/pauri-04.jpg'),
  'japji/pauri-05.jpg': require('../../assets/app/japji/pauri-05.jpg'),
  'japji/pauri-06.jpg': require('../../assets/app/japji/pauri-06.jpg'),
  'japji/pauri-07.jpg': require('../../assets/app/japji/pauri-07.jpg'),
  'japji/pauri-08.jpg': require('../../assets/app/japji/pauri-08.jpg'),
  'japji/pauri-09.jpg': require('../../assets/app/japji/pauri-09.jpg'),
  'japji/pauri-10.jpg': require('../../assets/app/japji/pauri-10.jpg'),
  'japji/pauri-11.jpg': require('../../assets/app/japji/pauri-11.jpg'),
  'japji/pauri-12.jpg': require('../../assets/app/japji/pauri-12.jpg'),
  'japji/pauri-13.jpg': require('../../assets/app/japji/pauri-13.jpg'),
  'japji/pauri-14.jpg': require('../../assets/app/japji/pauri-14.jpg'),
  'japji/pauri-15.jpg': require('../../assets/app/japji/pauri-15.jpg'),
  'japji/pauri-16.jpg': require('../../assets/app/japji/pauri-16.jpg'),
  'japji/pauri-17.jpg': require('../../assets/app/japji/pauri-17.jpg'),
  'japji/pauri-18.jpg': require('../../assets/app/japji/pauri-18.jpg'),
  'japji/pauri-19.jpg': require('../../assets/app/japji/pauri-19.jpg'),
  'japji/pauri-20.jpg': require('../../assets/app/japji/pauri-20.jpg'),
  'japji/pauri-21.jpg': require('../../assets/app/japji/pauri-21.jpg'),
  'japji/pauri-22.jpg': require('../../assets/app/japji/pauri-22.jpg'),
  'japji/pauri-23.jpg': require('../../assets/app/japji/pauri-23.jpg'),
  'japji/pauri-24.jpg': require('../../assets/app/japji/pauri-24.jpg'),
  'japji/pauri-25.jpg': require('../../assets/app/japji/pauri-25.jpg'),
  'japji/pauri-26.jpg': require('../../assets/app/japji/pauri-26.jpg'),
  'japji/pauri-27.jpg': require('../../assets/app/japji/pauri-27.jpg'),
  'japji/pauri-28.jpg': require('../../assets/app/japji/pauri-28.jpg'),
  'japji/pauri-29.jpg': require('../../assets/app/japji/pauri-29.jpg'),
  'japji/pauri-30.jpg': require('../../assets/app/japji/pauri-30.jpg'),
  'japji/pauri-31.jpg': require('../../assets/app/japji/pauri-31.jpg'),
  'japji/pauri-32.jpg': require('../../assets/app/japji/pauri-32.jpg'),
  'japji/pauri-33.jpg': require('../../assets/app/japji/pauri-33.jpg'),
  'japji/pauri-34.jpg': require('../../assets/app/japji/pauri-34.jpg'),
  'japji/pauri-35.jpg': require('../../assets/app/japji/pauri-35.jpg'),
  'japji/pauri-36.jpg': require('../../assets/app/japji/pauri-36.jpg'),
  'japji/pauri-37.jpg': require('../../assets/app/japji/pauri-37.jpg'),
  'japji/pauri-38.jpg': require('../../assets/app/japji/pauri-38.jpg'),
  'japji/salok.jpg': require('../../assets/app/japji/salok.jpg'),
};

/** Resolve a filename to a bundled asset; unknown names fall back to the journey art. */
export function image(file: string): ImageSourcePropType {
  return IMAGES[file] ?? IMAGES['journey-calm.jpg'];
}
