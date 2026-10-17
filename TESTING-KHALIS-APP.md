# Testing the Kids Mode PRs in the real Sundar Gutka app (Mac + Xcode)

The Kids Mode PRs live in branches of this repo that contain the full Khalis app (bare React Native 0.78, JavaScript). Testing a PR means building the Khalis app with that branch and walking its checklist on a phone. The Expo demo app is not involved here.

Branches: `master` = Khalis `dev` untouched · `feature/kids-mode` = PR 1 (merged, reviewed) · `kids/screens` = PR 2 (done) + PR 3 (work in progress). PR 4 is not built yet.

## 0. One-time setup (about an hour the first time)

1. Xcode from the App Store, then `xcode-select --install`. Open Xcode once and install the iOS platform when prompted.
2. Node 18 or newer (`node -v`), Yarn 1 (`corepack enable`), Watchman (`brew install watchman`).
3. Ruby + CocoaPods through the repo's Gemfile: `brew install rbenv ruby-build` (or any Ruby ≥ 2.6.10), then in the repo `gem install bundler && bundle install`.
4. Known Xcode 26 issues (from Khalis PR #397, read its description if the build fails): the Metal toolchain must be installed, and a header workaround for `fmt` 11.0.2 may be needed.
5. iPhone: plug in by USB, trust the Mac, enable Developer Mode (Settings → Privacy & Security). In Xcode, sign the `SundarGutka` target with your free Apple ID (Signing & Capabilities → Team), and change the bundle identifier suffix if signing complains. A free account installs for 7 days.

```sh
git clone https://github.com/Gurjaapk1/Ucharaan-2026.git khalis-kids && cd khalis-kids
git switch feature/kids-mode
yarn install --frozen-lockfile
cd ios && bundle exec pod install && cd ..
```

Point the scoring client at the server (needed from PR 3 on): in `src/common/constant.js` set `KIDS_SCORING_URL` to the current server URL (ask Avi; the Azure URL once deployed, else the tunnel URL in DEMO-SETUP.md) and `KIDS_SCORING_API_KEY` to `uchaaran-demo`. Do not commit that edit.

Run: `yarn ios --device` (or open `ios/SundarGutka.xcworkspace` in Xcode, pick your iPhone, press Run). Metro starts in a terminal; JavaScript edits reload live; native changes (PR 3 adds a recorder library and permissions) need a rebuild.

## 1. Test PR 1 (branch `feature/kids-mode`)

- Settings → scroll to the end: a "Kids Mode" section with one switch.
- Switch it on: a second switch "Check pronunciation online" appears with its one-line explanation. Switch Kids Mode off: it disappears.
- Kill the app, reopen: the switches remember their state.
- With Kids Mode off, use the reader, audio player and settings as usual: nothing changed.
- Pass = all four. Report anything else you notice.

## 2. Test PR 2 (branch `kids/screens`, first commit `95ca6bc` = PR 2 only)

```sh
git switch kids/screens && git checkout 95ca6bc   # PR 2 alone
yarn install --frozen-lockfile && cd ios && bundle exec pod install && cd ..
yarn ios --device
```
- Kids Mode off: no Kids entry anywhere. On: a Kids entry appears on the Home screen header.
- Journey: Japji pauris listed with stars; Pauri 1 opens Practice; later pauris are offered or marked coming soon (tell us which).
- Practice: the pauri's lines, each word separate; the English transliteration under words follows Settings → Transliteration (on/off, language).
- Play: the reciter's audio starts at this pauri, not at the start of Japji; the current word highlights roughly in time (word timing is estimated from line timing, so expect drift inside a line).
- Night mode: the screens follow it.

## 3. Test PR 3 (branch `kids/screens`, tip; currently a WIP commit)

```sh
git switch kids/screens && git pull
yarn install --frozen-lockfile && cd ios && bundle exec pod install && cd ..   # new recorder dependency
yarn ios --device
```
- Opt-in OFF: Practice → "Try reciting" → record → stop: no upload; the message tells you to turn on "Check pronunciation online" in Settings.
- Opt-in ON: first recording asks for microphone permission (the permission text mentions checking pronunciation). Recite Pauri 1, stop: "Checking…" for a few seconds, then every word marked like / check / unclear, one focus word with "Practise this word", its reciter clip plays, stars and coins appear.
- Planted errors: say ਸੋਚਿ as ਸੋਚੀ (expect a check on it); skip ਲਖ (expect a check on it or its neighbour); stop halfway (unspoken lines unclear, no score invented).
- Redo the same pauri: coins are not awarded twice for the same star.
- Airplane mode, record, stop: a clear failure message, no coins, app still usable.
- After a recording, go back to Practice and play the reciter: audio still plays through the speaker (iOS routing after recording is the known risk).

## 4. Whole-flow test (after PR 3 passes)

Settings → Kids Mode on → opt-in on → Home → Kids entry → Journey → Pauri 1 → Practice → Try reciting → record → results → back to Journey (stars updated) → Settings → Kids Mode off → app is the normal Sundar Gutka again.

## Reporting

For each PR: pass/fail per bullet, the phone model and iOS version, and a screen recording of anything that failed. Put notes in `docs/testing/<date>-<PR>.md` on a branch and open a PR to `main`, or message Avi.
