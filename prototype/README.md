# Uchaaran interactive prototype

A React web prototype for reviewing a future Sundar Gutka Kids Mode. Choose Prem Singh or Sehaj Kaur, explore a bani world, open the Japji Sahib map, practise a line, complete a continuous demo challenge, and spend earned Nanak coins on character frames.

## Run and verify

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4173
npm run build
npm run check:runtime
npm run test:sites
node --experimental-strip-types --test tests/rewards.test.mjs
```

The device picker switches between iPhone and Android presentations. The application is React DOM inside the retained Product Design mobile preview runtime, not a React Native build. No native dependencies or existing Sundar Gutka files were changed.

## What works

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

See [sources](SOURCES.md), [native integration](NATIVE_INTEGRATION.md), and [design QA](design-qa.md).
