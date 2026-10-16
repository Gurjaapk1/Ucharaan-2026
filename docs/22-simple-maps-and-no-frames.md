# Simpler maps and character rewards

Frames are removed from the prototype. Character setup now chooses only Prem Singh or Sehaj Kaur. The avatar has no cosmetic frame, and map stop borders no longer change with equipped frame colors. Clothing, Belongings and Actions remain the three reward categories.

## Existing progress

The save parser ignores retired top-level frame ownership and equipment fields. It preserves coin balances, mastery stars, attempts, display preferences and the nested wardrobe. New saves contain no frame fields. Loading an older save and saving it again makes the same migration without resetting progress. The unused frame catalogue and purchase function have also been removed.

## Map direction

The original `journey-calm.jpg` is the visual reference. The six revised regional maps use broad muted shapes, sparse trees and simple landmarks rather than dense crops, rocks, flowers or foliage. Region identity comes primarily from terrain: fields, riverbanks, hills, coast, orchards and cultivated gardens. Numbered stops, stars and the complete pauri panorama on entry are retained.

The pauri panoramas themselves are unchanged. This revision concerns the regional navigation maps. The previous detailed region originals remain in `outputs/journey-regions/source/`; revised originals and review images are in `outputs/journey-regions/calm-v2/`. New runtime filenames end in `-calm.jpg`.

## Implementation

Shared feature code remains JavaScript/JSX with React Native primitives. The preview phone runtime is unchanged. Native integration should use the updated `regions` image filenames and retain each map's aspect ratio and stop coordinates.

## Verification

The production build, 28-file runtime integrity check, 17 domain tests and four Sites worker tests pass. The retired frame purchase test was removed with its obsolete function. Migration tests cover old frame saves, existing wardrobe ownership/equipment and repeated loading. All six illustrations were inspected; first and final map stops were checked in the phone preview. The published app retains the previous two stars and 20 coins, and character setup has no frame selector. Version 14 is live with the same public audience.
