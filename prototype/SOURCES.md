# Prototype sources

## Sundar Gutka source

`Gurjaapk1/Ucharaan-2026` master commit `e949f2f1429c41882b639bcfaaa8133bd4ac5047` was fetched and inspected without checking it out or modifying it.

- `src/theme/lightTheme.js`: navy #113979, gold #DEBB0A, white surface, secondary surface #faf9f6.
- `src/theme/typography.js` and `assets/fonts/BalooPaaji2-*.ttf`: app typography.
- `images/sundar_gutka_icon.png` and `images/khalislogo150.png`: original project assets.
- `src/common/constant.js`: reference audio base URL.
- `src/ReaderScreen/components/AudioPlayer/hooks/useAudioManifest/index.js`: Bhai Jarnail Singh Japji Sahib audio path.
- `src/ReaderScreen/components/AudioPlayer/assets/lyrics/BhaiJarnailSingh/japji-sahib.json`: 385 bundled per-line timestamp entries. Matched in order to the 385 BaniDB verses; all 38 pauri groups extracted without retyping.

## Content and characters

- Scripture and English meanings: https://api.banidb.com/v2/banis/2, fetched October 16, 2026. `src/bani.json` includes paragraphs 4–41 as pauris 1–38. Original export remains in the project QA source folder, not the published bundle.
- Books: https://shop.khal.is/collections/childrens
- Prem Singh's Vacation cover: https://shop.khal.is/cdn/shop/products/Untitleddesign_7_540x.png?v=1665164944
- Sehaj Kaur's Day cover: https://shop.khal.is/cdn/shop/files/Untitleddesign_6_540x.png?v=1712366431
- `prem-character.png` and `sehaj-character.png`: generated game interpretations using those covers as references. Proposed adaptations, not official new book illustrations.
- `reflection-scene.png`, `grain-scene.png`, `path-scene.png`: generated interpretive landscape companions, not literal theological explanations. No Guru or deity depicted. Educator review required.

## Existing design assets

Terrain from the selected Paper work: https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0 . Exact layout values were inspected via Paper JSX export. New user requests intentionally replace the prior green UI palette with Sundar Gutka navy and remove history games.

Lucide icons retain the included ISC license at `public/assets/LICENSE-lucide`. The star uses the existing Paper gold fill and outline. Mobile preview runtime is the retained Product Design template; its protected files are unchanged.

## Deliberate prototype choices

38 pauris, six regions, all available for review; six other banis are previews. Coins reward newly earned stars at 10 coins per star. Three stars is 30 coins maximum per pauri. Cosmetic frames are the working V1 reward. Books, merchandise, coupons and gifts are unimplemented proposals, not promised benefits. Meaning scenes currently cover Pauri 1; historical games are excluded.

## Source-aligned React Native Web revision

- `src/HomeScreen/components/BaniHeader.jsx`, `src/HomeScreen/styles.js`: navy header, Punjabi title and fateh, original ornamental glyphs, settings placement.
- `assets/fonts/GurbaniAkharTrue.ttf`: original header ornaments and Ik Onkar glyph.
- `src/common/components/BaniList/BaniList.jsx`: full-width bani rows with dividers.
- `src/Settings/styles/index.js`, `src/Settings/components/comon/listItemComponent.jsx`: grouped settings and trailing switches.
- `src/common/components/BottomNavigation/style.js`: navy navigation and rounded white active item.
- `src/ReaderScreen/styles/index.js`: uncluttered verse and translation presentation.
- `src/theme/darkTheme.js`: dark surface and action colors. Learning feedback colors are new additions.
- `src/KidsMode/bani-catalog.json`: selected names copied without retyping from the previously captured BaniDB `/v2/banis` response. This is a preview subset, not the complete native catalogue or its user-defined order.
- React Native Web setup: https://necolas.github.io/react-native-web/docs/setup/ . The web package resolves `react-native` to `react-native-web` using an npm alias; all app-owned UI primitives use the native import path.

The new home/settings icons are simple outline drawings for the web adapter. In the native adapter, use Sundar Gutka's existing icon components. No native simulator screenshot was available for pixel-level comparison. Layout fidelity is based on the inspected source, not a claim of an exact device render.

## Connected story artwork

`pauri-1-story-panorama.png` and `journey-region-one.png` were generated for this prototype using the selected riverside terrain as the style reference. They share soft sculpted terrain, warm earth, quiet blue water and a continuous ochre path. The first is a six-stop interpretive memory walk within Pauri 1; the second is the outer map for Pauris 1–6. Neither depicts a Guru or claims a historical composition location. These are prototype art references pending educator and Khalis review. Earlier separate scene assets are retained as recovery/reference material.

## Quieter artwork revision

`pauri-1-calm.jpg` and `journey-calm.jpg` are simplified edits of the prior generated panorama and region-one map. They preserve the landmark sequence while replacing dense 3D detail with broad painted shapes. JPEG exports reduce transfer size without changing the composition. These are interpretive prototype assets, not historical documentation or approved theological depictions.

## Garden clothing variants

`public/assets/prem-garden.png` and `sehaj-garden.png` were created with the built-in image-generation tool on October 16, 2026, from the respective existing character PNGs. Prompt: preserve face, turban, pose and full-body framing; change main clothing to muted sage green with cream embroidery; retain original accessories and shoes; transparent background, no new symbols or scenery. These are prototype wardrobe adaptations, pending Khalis review. New reward SVGs are simple original interface symbols, not depictions of verified historical artifacts.

## Roman-letter reading support

`src/bani.json` now includes BaniDB `transliteration.en` from the previously captured October 16 export. All 374 lesson lines match their source paragraph, order and exact Unicode text. Existing Gurmukhi, English meaning and audio timestamps are unchanged. No transliterations were invented or machine-generated locally.
