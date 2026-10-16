---
name: kids-mode
description: Use for any work on the Uchaaran Kids Mode feature in Sundar Gutka (Sarbat hackathon) - adding screens, state, recording, scoring, tests, branches or PRs. Holds the merge-first rules, file boundaries, branch flow and Khalis conventions.
---

# Kids Mode (Uchaaran Helper) for Sundar Gutka

Kids Mode helps grades 6-8 practise Gurbani pronunciation against an ustaad's standard, starting with the first pauris of Japji Sahib. It is built as an extension Khalis Foundation can merge into `KhalisFoundation/sundar-gutka-react` `dev`.

**Half of the judging rubric is how easily Khalis can merge this.** Every choice below serves that.

## Repos and branches

| Where | What |
| --- | --- |
| `Gurjaapk1/Ucharaan-2026` `master` | Khalis `dev` with full history, same commit SHAs |
| `Gurjaapk1/Ucharaan-2026` `feature/kids-mode` | Team integration branch. Never commit to it directly |
| `Gurjaapk1/Ucharaan-2026` `codex/v1-product-journey` | Product docs and Paper mockups |
| `avioberoi/sundar-gutka-react` | Fork used only to open the final PRs into Khalis `dev` |

Flow:
1. Branch from `feature/kids-mode` as `kids/<piece>` (e.g. `kids/settings-toggle`, `kids/recording`).
2. Open a PR back into `feature/kids-mode` as soon as the piece works. Merge at least daily; long-lived branches all collide in the same few shared files.
3. Keep up with Khalis: `git remote add upstream https://github.com/KhalisFoundation/sundar-gutka-react.git`, then `git fetch upstream && git merge upstream/dev` into `feature/kids-mode`.

## Merge-first rules

1. **New code lives in `src/KidsMode/`**: screens, components, hooks, the reducer, the scoring client, storage helpers and their tests.
2. **Existing files get only registration lines**:
   - `src/common/reducer.js`: one `kidsMode` key importing our reducer
   - `src/common/actions/actionTypes.js`, `actions/index.js`: our action types and creators
   - `src/navigation/index.jsx`: one `Stack.Screen` per Kids screen
   - `src/Settings/index.js`: one `<KidsModeComponent />` line
   - `src/common/localization.js`: our strings
   - `ios/SundarGutka/Info.plist`: `NSMicrophoneUsageDescription`; `android/app/src/main/AndroidManifest.xml`: `RECORD_AUDIO`

   Anything beyond this needs team agreement first.
3. **Do not modify the reader** (`src/ReaderScreen/**`, including `gutkaScript.js` and `gutkahtml.js`). Open Khalis PRs #397 and #400 are editing it. The practice screen renders its own panktis.
4. **Off by default.** With Kids Mode off, the app must behave exactly as today.
5. **Minimise native dependencies.** Reuse `react-native-track-player` for playback and `react-native-fs` for files. Recording needs exactly one library; agree on it before adding it. No other native modules. Checked 2026-10-16: the repo is on the old architecture (`newArchEnabled=false`), so `react-native-nitro-sound` (needs RN ≥ 0.79) is out; the only zero-peer recorder that fits is `react-native-audio-recorder-player` 3.6.14. A WebView recorder needs its own WebView with an https `baseUrl` (the reader's WebView has a null origin) and conflicts with track-player's audio session on iOS; treat it as unproven until the iPhone spike passes.
5a. **Write JavaScript (`.js`/`.jsx` with PropTypes), not TypeScript.** `.tsx` compiles, but `yarn lint` silently skips it (no ESLint override) and nothing runs `tsc`, so a TypeScript island would ship unlinted and unchecked through Khalis's CI. Port the prototype's `.tsx` to `.jsx`.
6. **Scoring runs outside the app** behind one API call. The app sends audio and shows the result. Audio leaves the phone only after a parent opts in, which is off by default.
7. **Recordings are files**, stored under `DocumentDirectoryPath/kids/` via `react-native-fs`. Their metadata lives in the persisted `kidsMode` Redux state. Never write to `gutka_v01.db`: database updates delete and replace it.

## Khalis conventions (from CONTRIBUTING.md)

- Functional components with hooks. Redux Toolkit for shared state, `useState` for local state.
- Style with `useThemedStyles` and `StyleSheet.create()`, so Kids screens follow night mode.
- **Tests are required** for every new component, hook and utility: Jest and React Testing Library, placed next to the file as `Name.test.jsx`, using mocks from `@common/test-utils`.
- `yarn lint` and `yarn test` pass before every PR.
- Conventional commits (`feat(kids-mode): ...`, `fix(kids-mode): ...`). Small, focused PRs.
- Use Gurbani text from the app database (`mv_Banis_Shabad`, `Bani = 2` for Japji Sahib). Never retype or invent Gurbani or pronunciation rules.

## Useful facts about the app

- Audio tracks are on Khalis's CDN (`constant.AUDIO_BASE_URL`). Line timings are bundled in `src/ReaderScreen/components/AudioPlayer/assets/lyrics/<Reader>/*.json` as `{start, end, text: "<Seq>"}`, per line only. Word timings come from our alignment step.
- `db.js` already splits each line into words with `split(" ")`. Word index = position in that split.
- Settings toggle pattern: see `src/Settings/components/larivaar.jsx`.
- iOS build on Xcode 26.4 needed extra setup (Ruby bundle, Metal toolchain, fmt 11.0.2 header workaround); see the description of Khalis PR #397.

## Before the PRs to Khalis

Delete `AGENTS.md`, `CLAUDE.md` and `.agents/`. They are team tooling, not part of the feature.
