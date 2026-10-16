# Published prototype and resumption

Live URL: https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site

Published successfully October 16, 2026. User explicitly selected anyone-with-link sharing; Sites confirmed public access. Version 10 now opens into the source-aligned Sundar Gutka home screen. Enable Kids Mode in Settings to reach the journey.

- Site project: `appgprj_6ad297e1c9a08191a4c59d00aa49a007`
- Saved version: `appgprj_6ad297e1c9a08191a4c59d00aa49a007~appgver_38456308d3d0819190247a8637f51326`
- Deployment: `appgdep_6ad2aaaaee288191876a3fac5e064166`
- Pushed Sites source commit: `41d64ce62ae8d20350e576b870cd6c2d398c7123`
- Team source: `prototype/` in this project, tracked as ordinary files.
- Separate Sites deployment checkout: `tmp/sites-rnw-source/`, preserved with its clean source Git history. It contains the exact deployed source. This keeps nested deployment Git metadata out of the team's project source.
- Build archive: `tmp/uchaaran-javascript-site.tar.gz`, unchanged after deployment.

## Resume a prototype revision

Edit `prototype/`, keep the mobile template protected files unchanged, and run its build, runtime, rewards and Sites worker tests. Verify affected interactions visually. Sync only reviewed source changes into the separate `tmp/sites-rnw-source/` checkout, preserving its `.git` and Site identity. Renew a Sites source credential through the connector, supply it only through the source workflow helper's hidden stdin, and build/package/push from the deployment checkout. The Site is now public, so use the audience-appropriate save/deploy operations rather than private-only publishing.

For native implementation, follow `prototype/NATIVE_INTEGRATION.md` and Avi's current skill on `feature/kids-mode`. Do not merge this browser prototype or its preview runtime into Sundar Gutka's native app as feature code.

## Team review on GitHub

The prototype and updated design documentation are shared on `codex/v1-product-journey` for Avi and the team to use as a React Native reference. Sites publication uses a separate hosting repository.

- [Prototype source and run instructions](https://github.com/Gurjaapk1/Ucharaan-2026/tree/codex/v1-product-journey/prototype)
- [React Native integration contract](https://github.com/Gurjaapk1/Ucharaan-2026/blob/codex/v1-product-journey/prototype/NATIVE_INTEGRATION.md)
- [Latest product decisions](https://github.com/Gurjaapk1/Ucharaan-2026/blob/codex/v1-product-journey/docs/12-interactive-prototype.md)
- [Design QA and verification](https://github.com/Gurjaapk1/Ucharaan-2026/blob/codex/v1-product-journey/prototype/design-qa-rewards.md)

This is the design/reference branch. Native implementation should follow Avi's branch flow from `feature/kids-mode`; do not merge the browser preview runtime into the native app.

Version 5 uses shared React Native components rendered through React Native Web. Browser-only ports and remaining native integration work are documented in the integration contract. Old Sites checkout and archive remain as recovery material.

Version 5 adds the connected Pauri 1 story, matching region-one art, recall practice, slower audio, saved progress, attempt history and next-pauri continuation. The published story was opened and visually verified. Source and generated assets remain in the team repository; only compiled runtime assets are published.

Version 5 simplifies the illustration style and copy, makes the whole-path view optional, adds a saved Illustrations toggle and keeps reading actions in a fixed bottom bar. See `docs/15-production-polish.md` for the current visual rules and before/after review.

Version 6 adds full-pauri word feedback after continuous recitation, a tappable practice coach, reference-line playback and exact-line retry. Scores and suggestions remain examples. The AI integration contract is in `docs/16-word-level-feedback.md`.

Version 7 standardizes interface spelling to American English: practice. Build, runtime integrity and four Sites worker checks pass.

Version 8 expands Nanak rewards into Clothing, Belongings and Actions, with isolated demo coins, preview sheets, independent equipment slots and free story/milestone unlocks. Nineteen tests pass. The live wardrobe and outfit preview were opened after deployment.

Version 9 adds Roman-letter Punjabi between Gurmukhi and English meaning in practice and memory walk. All 374 lesson lines are source-matched; prior text, translations and timestamps are unchanged. Build, protected runtime and Sites tests pass. Final recitation-following requirements are in `docs/18-pronunciation-and-live-following.md`; live speech alignment is not implemented.

Version 10 converts app-owned code to JavaScript/JSX while retaining the protected TypeScript preview shell. All 19 tests and the production build pass. See `docs/19-javascript-handoff.md`.
