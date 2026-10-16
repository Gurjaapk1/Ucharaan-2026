# Prototype sources

## Sundar Gutka source

`Gurjaapk1/Ucharaan-2026` master commit `e949f2f1429c41882b639bcfaaa8133bd4ac5047` was fetched and inspected without checking it out or modifying it.

- `src/theme/lightTheme.js`: navy #113979, gold #DEBB0A, surface #faf9f6.
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
