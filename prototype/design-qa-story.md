# Pauri 1 story revision QA

Checked October 16, 2026 in Chrome using the retained iPhone and Pixel 10 preview frames. This verifies browser behavior, not native binaries or pronunciation accuracy.

## Verified behavior

- Pauri 1 opens a six-stop story using one panorama. Overview and focused views preserve the same geography. Stop selection updates the line and cue.
- The last stop enters recall practice at line 1. Reveal displays the actual Gurbani and meaning. The line picker uses neutral line numbers in recall mode.
- Slower reference audio switches on and reference playback starts. Navigation stops audio.
- Continuous challenge moves through the lines and their image views automatically. The first completed attempt shows 84%, two stars, a line rubric and 20 coins.
- Continue opens Pauri 2. Reload preserves Kids Mode, character, two stars, 20 coins, selected Pauri 2 and the attempt in My explorer.
- The matching region-one terrain displays all six pauri markers and star indicators.
- Story layout was visually inspected in iPhone and Pixel frames. Content scrolls inside the phone.
- An animation cleanup crash was found and corrected with a browser-only `global` alias. Story-to-practice navigation and subsequent animated challenge progression work after the fix.

## Automated checks

TypeScript and production build pass. All 28 protected runtime files pass integrity checks. Eight domain tests cover rewards and saved-state validation. Four Sites worker tests pass. The main script is about 731 KB before gzip and 225 KB gzip; Vite reports its existing bundle-size advisory.

## Evidence and limits

`qa/story-map.png`, `qa/story-walk.png`, `qa/story-android.png` and `qa/story-results.png` capture the revised UI. The artwork is a proposed mnemonic reference, not an approved interpretation. Educator review, child recall testing, native accessibility, physical-device testing and real scoring remain outstanding. Reduced-motion support is implemented through React Native AccessibilityInfo, but has not been tested on a physical device.

The second completed challenge showed 96%, three stars and only 10 additional coins. Buying River explorer spent 20 coins; reload preserved the equipped reward and remaining 10 coins. Site version 4 was opened at the public URL and the new story artwork was visually verified (`qa/story-live.png`).
