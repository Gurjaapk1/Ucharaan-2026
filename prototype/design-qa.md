# Original DOM prototype QA

Historical baseline. See [current React Native Web QA](design-qa-rnw.md) for the current revision.

final result: passed

Compared October 16, 2026. This passes as an interactive web design prototype, not as validated pronunciation software or a native build.

## Visual evidence

Source visual truth: `../outputs/paper/historical-challenge/02.png`, `05.png`, and `09.png`, plus original terrain assets in `../outputs/paper/world-map/assets/`. Paper JSX for the map was inspected for direct source values. The user's subsequent requirements intentionally change the palette, character identities, reward model and continuous challenge flow.

Rendered implementation: `qa/map-final.jpg`, `qa/results.jpg`, `qa/rewards.jpg`, `qa/world.jpg`, `qa/challenge-paused.jpg`, and `qa/android-map.jpg`.

Browser viewport: 1400 × 1200. Verified iPhone screen CSS bounds of exactly 393 × 852. Screenshots are 393 × 852, density 1. Source captures are 390 × 844. Comparison copies normalize the implementation to 390 × 844, without including desktop canvas. Source uses a static status bar; implementation uses the unchanged template status bar and notch. These system chrome differences are excluded from app fidelity findings.

Combined visual comparisons were opened and inspected, not judged from code:

- Full view: `qa/map-comparison.jpg`, `qa/map-fixed-comparison.jpg`, `qa/map-final-comparison.jpg`.
- Score: `qa/results-comparison.jpg` plus `qa/score-focused.jpg` for stars, percentage and reward block.
- Rewards: `qa/rewards-comparison.jpg`; this captured the scrolled redemption state, so it verifies the selected reward and pricing rather than matching the original hero crop.
- Three-screen handoff: `qa/journey-preview.jpg`.

## Findings and iteration history

1. [P2, resolved] The selected-pauri action was partly covered by persistent navigation. Initial `qa/map.jpg` and comparison show the issue. Reduced the app map height from 450 to 390 px. `qa/map-fixed.jpg` shows the whole action above navigation.
2. [P2, resolved] Region label overlapped the upper map stop after the height reduction. Moved the label to the upper right. `qa/map-final.jpg` and its comparison show all stop numbers, star counts and the selected action unobstructed.
3. [P2, resolved] Verse punctuation could wrap onto a line by itself. Applied balanced wrapping to Gurmukhi and rubric text. The continuous challenge capture shows balanced two-line text without isolated closing punctuation.
4. Test harness observation: browser semantic clicks scroll the template phone shell toward its hidden keyboard, even though the keyboard is not active. Native pointer/AX interactions do not do this. Reloaded and used native interactions for the complete QA journey. Protected runtime files were not modified to bypass integrity checks.

No actionable P0/P1/P2 product findings remain in the verified states.

## Required fidelity surfaces

- Typography: Baloo Paaji 2 regular and semibold are copied from master. This intentionally replaces the old mock's Nunito. Gurmukhi uses the actual Unicode font; headings, percentages, line text and labels are readable. Long text scrolls within the app. Runtime system typography is unchanged.
- Spacing/layout: rounded content groups, six numbered map stops, star triplets and bottom navigation retain the selected map hierarchy. New region chips and the fourth world navigation item are intentional. CTA visibility was corrected. Android map and navigation fit without overlap.
- Colors: master navy #113979 and paper #faf9f6 replace green UI chrome. Gold stars follow the Paper artwork. Green/red rubric rows also include textual statuses, so meaning does not rely on color alone.
- Image quality: original illustrated terrain and Lucide assets are used. No CSS/emoji substitutes for the requested terrain or characters. New character art is a clearly documented adaptation of the book covers. Pauri 1's meaning illustrations are interpretive and require educator review.
- Copy/content: Nanak coins is spelled consistently. Practice and continuous challenge are distinct. Sample scores are labeled before, during and after the challenge. Preview banis say they are previews. No history-game promises remain. Reward costs and balances are real prototype state, not hard-coded decorative numbers.

## Functional verification

- Entered as Prem Singh, opened the world and pauri map.
- Opened Practice, displayed the exact Gurmukhi line and BaniDB meaning, and observed the reference audio control transition to Pause reference.
- Ran Pauri 1 continuously from line 1 through the final line without per-line recording controls. Result: 84%, two stars, +20 coins.
- Redeemed River explorer for 20 coins. Verified balance 0 and Equipped state; a 30-coin option was disabled.
- Returned to the map and verified two retained stars.
- Selected 96% demo result. Paused on line 6, verified stable pause, resumed and completed. Result: three stars and +10 coins, not another 30.
- Switched to Android and inspected the full map and persistent navigation.
- Changed from Prem Singh to Sehaj Kaur. Verified the shared balance and existing progress were retained.
- Tapped Jaap Sahib and verified the preview message.
- Browser console inspection returned no errors or warnings.
- Reward domain tests cover exact thresholds, repeated attempts, lower scores, upgrades, per-pauri independence, duplicate redemption and insufficient balance.
- TypeScript build, runtime integrity check and four Sites worker tests passed. All 28 protected mobile runtime files remain intact.

## Follow-up limits

Real speech alignment, recording, scoring validation, offline behavior, native device builds and all 38 pauris' audio correctness are not verified here. Only Pauri 1 has dedicated changing scene concepts. Progress resets on reload by design. Native component tests and lint belong to the future Kids Mode implementation described in NATIVE_INTEGRATION.md.
