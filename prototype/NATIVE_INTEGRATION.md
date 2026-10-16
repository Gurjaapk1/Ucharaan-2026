# Native integration contract

Avi's [Kids Mode skill](https://github.com/Gurjaapk1/Ucharaan-2026/blob/59e720d0a9578c8f5fdead0f7e95db3c4174b0c7/.agents/skills/kids-mode/SKILL.md) was found on `feature/kids-mode`, not `master`, and reviewed before publication. Its integration rules govern the native feature. This separate web prototype answers the user's explicit request for a testable ChatGPT Site and is not a native feature PR.

## Native boundaries

Branch from `feature/kids-mode` into `kids/<piece>`. Keep new production code under `src/KidsMode/`. Add only approved registration lines to reducers, action exports, navigation, settings, localization and microphone permission manifests. Do not modify `src/ReaderScreen/**`. Keep Kids Mode off by default. Parent opt-in is required before recordings leave the phone. Shared state belongs in the persisted kidsMode Redux slice, while recording files belong under `DocumentDirectoryPath/kids/`. Never write to the replaceable Gurbani database.

Reuse `react-native-track-player`, `react-native-fs`, `useThemedStyles` and existing theme tokens. A recording library needs team agreement. Scoring stays behind one external API. Use the app database's `mv_Banis_Shabad`, Bani 2, for production text. Web text here is an exact BaniDB export because the docs checkout has no bundled database. It is not a replacement database.

## Screen mapping

| Prototype screen | Native destination under src/KidsMode | Dependencies |
| --- | --- | --- |
| Character choice and wardrobe | ExplorerScreen | Redux character and owned cosmetics |
| Bani world | WorldScreen | Enabled bani catalogue |
| Region and pauri map | JourneyScreen | Per-pauri best stars and region metadata |
| Practice | PracticeScreen | Database panktis, Track Player, bundled timings |
| Continuous challenge | ChallengeScreen | One recording session, live alignment, pause/resume |
| Scorecard and retry | ResultsScreen | Scoring API response; line/word indices |
| Rewards | RewardsScreen | Idempotent award and redemption actions |

Reuse image assets and the reward calculations, but translate DOM/CSS into React Native views, images, pressables, scroll views and themed styles. Do not copy the web phone preview runtime into the app. The existing app remains untouched by this prototype.

## Required production validation

- Tests beside each new component, hook and utility using existing Jest/React Testing Library mocks.
- `yarn lint` and `yarn test` before a PR.
- Device tests for text/font rendering, audio seeking, interruption and microphone permissions.
- Ustaad validation of pronunciation rules, word alignment and score thresholds. Do not infer correctness from the web simulation.
- Verify that switching character never resets progress or grants duplicate coins; server-backed award IDs are needed before real shared progress.
- Verify parental controls and local-only recording behavior with opt-in off.
- Grades 6–8 are the skill's target audience. Test whether the chosen book-character direction feels appropriate to that age group.
- Remove team AGENTS.md, CLAUDE.md and .agents tooling from final upstream feature PRs as Avi specifies.
