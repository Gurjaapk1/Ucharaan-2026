# Uchaaran interactive prototype

A React Native Web prototype for reviewing a future Sundar Gutka Kids Mode. Start on the source-aligned Sundar Gutka home screen, open Settings, and turn on Kids Mode. Choose Prem Singh or Sehaj Kaur, explore a bani world, open the Japji Sahib map, practice a line, complete a continuous demo challenge, and unlock clothing, belongings and character actions.

## Run and verify

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4173
npm run build
npm run check:runtime
npm run test:sites
node --experimental-strip-types --test tests/rewards.test.mjs tests/experience.test.mjs tests/word-feedback.test.mjs
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
- Continuous challenge simulation with automatic progression every four seconds, pause/resume and a full-pauri word-level scorecard with tappable scores, practice prompts, reference-line audio and direct line retry. Test score scenarios are available in Settings; the default demo gives 84% first and 96% on later attempts.
- Ten Nanak coins per newly earned star. Higher scores pay only the improvement. Lower scores never remove stars. Redemption checks balance and avoids charging for an owned item.
- Independent Clothing, Belongings and Actions slots, coin purchases, free milestone/story unlocks, preview before equipping, and saved ownership. An isolated 60-coin demo lets reviewers try the flow without changing their saved progress. Legacy frames and map colors remain available through character setup. No physical rewards, real-money purchases or discounts.
- Pauri 1 has a connected six-stop memory walk, animated panorama, optional hidden words and slower reference audio. The map uses quieter painted terrain. Supporting pictures can be hidden in Settings; other pauris are text-first until their visual cues are developed. No history mini-games.
- Browser-saved preferences, character, stars, coins, wardrobe and recent attempt history. Continue the selected pauri or move forward after a result.

## Limits

No microphone is used and no pronunciation is assessed. Scores and timing progression are simulated. Progress and preferences are saved in this browser, not synced across devices. Clearing site data resets them. No personal child profile, analytics, account or recording is collected. Audio playback streams public reference audio from Khalis. The proposed star thresholds are 60%, 80% and 95%, pending ustaad calibration. The larger map is a design preview; the native hackathon scope starts with the first pauris.

Opening Mool Mantar and closing Salok are not lesson nodes in this prototype. They must be handled explicitly in the production content plan. Illustrated regions do not assert where individual pauris were written. The character adaptations and meaning illustrations need Khalis and educator review.

See [sources](SOURCES.md), [native integration](NATIVE_INTEGRATION.md), and [current design QA](design-qa-polish.md).

See [word-level feedback](../docs/16-word-level-feedback.md) for the proposed AI contract and current sample-data boundary.
