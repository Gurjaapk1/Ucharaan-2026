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

App-owned UI is now expressed with React Native primitives and StyleSheet under `prototype/src/KidsMode/`. Reuse those components, styles, content models and reward rules as a starting point. The UI no longer needs a wholesale DOM/CSS translation. The existing native app remains untouched.

### Adapter boundary

`types.ts` defines `HostPorts`. Provide native implementations as follows:

| Port | Web preview | Native integration |
| --- | --- | --- |
| Sheet | Retained phone BottomSheet with scrolling | Accessible native modal/sheet with safe areas |
| Scroll / HorizontalScroll | Retained MobileScroll / Carousel | React Native ScrollView, horizontal where appropriate |
| Icon | CSS masks over SVG files | Existing Sundar Gutka icon components |
| image(file) | `/assets/` URI | Static `require()` asset map, never dynamic require paths |
| audio | HTMLAudioElement with per-line end time and playback rate | Existing TrackPlayer utilities with progress subscription |
| storage | Validated versioned localStorage snapshot | Existing persisted kidsMode Redux slice |
| safeArea | Phone preview geometry | Existing safe-area context and platform conventions |

`components.tsx` has stable shared controls; `styles.ts` contains RN styles. `KidsApp.tsx` is the interactive screen coordinator, not the production navigator. Split it into native routes and connect the persisted Redux slice when integrating. Keep the existing Home, Settings and Reader as the actual native shell; the preview re-creates only the relevant subset of them.

Pass database-derived pauris through the `pauris` prop. Replace the demonstration timer and `lineScore()` with backend alignment and rubric results. `content.ts` sample scores must never be treated as a pronunciation model. Tie real coin awards to persisted, idempotent attempt IDs before introducing cross-device progress.

Do not copy `Prototype.tsx`, `src/mobile/`, `prototype.css`, the web worker or the web `package.json` into the native app. The web package aliases `react-native` to `react-native-web@0.21.4`; native integration keeps the app's real React Native dependency. The web type check uses legacy `@types/react-native@0.72.8` for common native APIs. It is not a substitute for compiling against the team's actual native version.

The Site preserves the preview runtime's status bar, so the top safe-area strip remains light. The actual app controls its native status bar. Catalogue coverage, Reader controls and settings are intentionally limited to the prototype's working paths. No claim of pixel-perfect equivalence or native build validation is made.

## Required production validation

- Tests beside each new component, hook and utility using existing Jest/React Testing Library mocks.
- `yarn lint` and `yarn test` before a PR.
- Device tests for text/font rendering, audio seeking, interruption and microphone permissions.
- Ustaad validation of pronunciation rules, word alignment and score thresholds. Do not infer correctness from the web simulation.
- Verify that switching character never resets progress or grants duplicate coins; server-backed award IDs are needed before real shared progress.
- Verify parental controls and local-only recording behavior with opt-in off.
- Grades 6–8 are the skill's target audience. Test whether the chosen book-character direction feels appropriate to that age group.
- Remove team AGENTS.md, CLAUDE.md and .agents tooling from final upstream feature PRs as Avi specifies.

## Pauri 1 story reference

`StoryScene.tsx` uses React Native Animated, Image and AccessibilityInfo to pan across one illustration and respect reduced motion. Use the same landmark composition in overview, practice and challenge. `story.ts` holds proposed memory cues separately from scripture. The browser-only global alias shim remains outside the shared feature folder.

`experience.ts` defines the current local snapshot and recent attempt shape. It is a prototype persistence boundary, not a replacement Redux store or server award ledger. Connect native state and migrations to the established application architecture. See `docs/14-visual-story-and-full-feature-preview.md` for the visual system and review criteria.

The polish revision adds a persisted `illustrations` display preference. Older snapshots default it to true without clearing rewards. The reading action bar is a sibling of scrolling content and respects the host safe-area inset. Retain this layout in native navigation. The calm JPEG assets replace the earlier dense terrain on active screens.

## Word-level review

`WordReview.tsx` renders the full pauri and coach. `wordFeedback.ts` preserves source offsets but supplies fixture scores and generic practice prompts only. Replace both fixture functions with confidence-aware backend results before production. See `docs/16-word-level-feedback.md` for alignment, timing and scoring requirements.

## Wardrobe

Reuse the slot model and pure transitions from `wardrobe.ts`. Map `Progress.wardrobe` into the existing kidsMode slice and migrate absent wardrobes to free defaults. Server-side entitlements and atomic coin transactions are required for cross-device use. `ExplorerPreview` uses native Animated, images and the host icon port. Replace simple body transforms and item symbols with reviewed animation/prop rigs for production. Keep temporary demo progress outside persisted state.
