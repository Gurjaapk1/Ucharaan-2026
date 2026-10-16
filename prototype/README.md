# Uchaaran interactive prototype

A React Native Web prototype for reviewing a future Sundar Gutka Kids Mode. Start on the source-aligned Sundar Gutka home screen, open Settings, and turn on Kids Mode. Choose Prem Singh or Sehaj Kaur, explore a bani world, open the Japji Sahib map, practise a line, complete a continuous demo challenge, and spend earned Nanak coins on character frames.

## Run and verify

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4173
npm run build
npm run check:runtime
npm run test:sites
node --experimental-strip-types --test tests/rewards.test.mjs
```

The device picker switches between iPhone and Android presentations. The app-owned screens use React Native View, Text, Pressable, Image, Switch and StyleSheet, rendered through React Native Web. The outer phone preview and browser audio adapter use React DOM. The native Sundar Gutka source is unchanged. This has not been built or tested as an iOS/Android binary.

## Shared source

`src/KidsMode/` contains the app UI, theme tokens, reward rules, content types and host interfaces. `src/Prototype.tsx` supplies browser-only audio, icons, image paths, scrolling and safe-area adapters. Do not copy this prototype’s package.json into the native app: its `react-native` dependency deliberately aliases React Native Web. See the integration contract for native wiring.

## What works

- Source-aligned Sundar Gutka bani list and Settings, Kids Mode off by default, working night mode, font size and translation controls.
- Two freely selectable characters sharing one progress record and wardrobe.
- Seven bani destinations, with Japji Sahib interactive and six explicitly marked as future previews.
- 38 pauris in six learning regions. All nodes are open for design testing.
- Practice with Gurmukhi, BaniDB English meaning, selectable lines and real reference audio using the existing Sundar Gutka CDN and bundled line timings.
- Continuous challenge simulation with automatic progression every four seconds, pause/resume and a final line-by-line scorecard. Example scores can be selected before starting.
- Ten Nanak coins per newly earned star. Higher scores pay only the improvement. Lower scores never remove stars. Redemption checks balance and avoids charging for an owned item.
- Frame customization and matching map-marker colors. No physical rewards, purchases or discounts.
- Pauri 1 uses three changing visual metaphors; other pauris use a shared landscape. No history mini-games.

## Limits

No microphone is used and no pronunciation is assessed. Scores and timing progression are simulated. Progress is in memory and resets on page reload. No child information, analytics, accounts or recordings are stored or transmitted. Audio playback streams public reference audio from Khalis. The proposed star thresholds are 60%, 80% and 95%, pending ustaad calibration. The larger map is a design preview; the native hackathon scope starts with the first pauris.

Opening Mool Mantar and closing Salok are not lesson nodes in this prototype. They must be handled explicitly in the production content plan. Illustrated regions do not assert where individual pauris were written. The character adaptations and meaning illustrations need Khalis and educator review.

See [sources](SOURCES.md), [native integration](NATIVE_INTEGRATION.md), and [current design QA](design-qa-rnw.md).
