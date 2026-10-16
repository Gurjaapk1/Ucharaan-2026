# React Native Web revision QA

Verified October 16, 2026 in Chrome with the retained iPhone and Pixel 10 preview frames.

## Result

The source-aligned web preview passes the exercised paths. This is not validation of a native iOS/Android binary or a pronunciation model.

- Home starts with the source-style Punjabi header, original ornaments and divider-based bani list. Kids Mode is off initially.
- Settings enables Kids Mode and opens character choice. Prem Singh and Sehaj Kaur remain selectable and customizable.
- The six-region Japji map opens a pauri and retains the earned stars and equipped marker color.
- Reference audio starts successfully; next-line navigation stops it. Practice has the source-style reading typography and a supporting illustration.
- The challenge advances automatically, exposes pause/resume, and completes with a sample score of 84%, two stars and 20 Nanak coins.
- Tapping the second scorecard line opens practice at line 2.
- Buying River explorer spends 20 coins, equips the reward and leaves zero coins. Unaffordable rewards are disabled.
- Pixel navigation retains progress and renders the map without horizontal clipping.
- Night mode and font-size controls update. Turning off English meanings removes them from the reader.
- A low-contrast dark status-bar strip was found during QA. The web adapter now supplies a white status-bar background while retaining the dark app surface. The protected device runtime is unchanged.

## Automated checks

- TypeScript and Vite production build pass.
- All 28 protected runtime files pass integrity checks.
- Five domain tests pass, including coin replay protection, redemption and rubric averages for all 38 pauris.
- Four Sites worker tests pass.
- Vite reports a non-blocking bundle-size advisory: the main script is approximately 608 KB before gzip, 191 KB gzip. No extra package was added just to optimize this design preview.

## Evidence

Current captures are `qa/rnw-map.png`, `qa/rnw-android-map.png`, `qa/rnw-practice.png`, `qa/rnw-results.png`, `qa/rnw-rewards.png`, and `qa/rnw-night-settings.png`. Older unprefixed captures and `design-qa.md` document the prior DOM prototype and are not the current visual baseline.

The baseline for the revision is the inspected Sundar Gutka source at `e949f2f1429c41882b639bcfaaa8133bd4ac5047`, especially HomeScreen, BaniList, Settings, ReaderScreen styles and theme files. Native simulator/store screenshots were not used for a pixel-level comparison. The preview intentionally shows a reduced catalogue and settings set.
