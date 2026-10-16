# Region maps and pauri previews

Each of the six regions has a separate painted terrain. Numbered stops, three-star mastery and the existing Nanak coin rules remain unchanged. Opening any pauri shows its complete panorama above Practice and Challenge. This establishes the whole scene before practice moves between close-up landmarks.

## Terrain plan

| Region | Pauris | Terrain and recurring landmarks |
| --- | --- | --- |
| The beginning | 1–6 | Golden fields, banyan tree, stone pool, grain shelter, open gate |
| By the river | 7–12 | Riverbanks, reeds, quiet pond, reading pavilion |
| Paths of listening | 13–18 | Rolling hills, sheltered paths, rooted tree, stone bridge |
| An open horizon | 19–24 | Estuary, distant sea, layered hills, basin and garden |
| A world of wonder | 25–30 | Orchard terraces, market, meal shelter, seedling garden |
| Growing in grace | 31–38 | Cultivated gardens, pottery, mountain river, open workshop |

The motifs come from the corresponding pauri panoramas. Region labels describe the art rather than asserting that a pauri was composed at a particular historical place. These are proposed memory cues for educator review.

## Interaction and implementation

- The winding path and numbered stops retain the existing game-map structure. Each stop opens its pauri. Previously earned stars remain visible below the stop.
- Each region stores its own asset, accessible description and explicit percentage coordinates in `prototype/src/KidsMode/content.js`. The last region has eight stops, rather than six stops with interpolated positions.
- The pauri opening page displays the full 3:1 panorama with `contain`, so no edge is cropped. The title comes from the same story record used during practice.
- Reading screens retain the Illustrations setting and optional overview. The opening preview provides orientation before entering a reading mode.
- All UI uses existing React Native components in JavaScript/JSX. Native integration must bundle the six assets in `public/assets/regions/` and resolve their filenames through `host.image`.
- Original PNGs and generation prompts are retained in `outputs/journey-regions/`. Runtime JPEGs are separate.

No speech alignment, scoring or reward behavior changes in this update.

## Verification

All six terrain images were visually inspected. Phone preview checks covered the first map, the eight-stop final map including its bottom stop after scrolling, entry previews for Pauris 31 and 38, and the transition from panorama to Pauri 31 line practice. The full panorama fits without cropping and the text and actions remain separate from the image.

All 18 domain tests and four Sites worker tests pass. The production build and 28-file protected runtime check pass. Scripture data is unchanged. Screenshots are in `outputs/journey-regions/review/`. Site version 12 was published successfully with the existing public audience. Native device performance and educator approval remain unverified.
