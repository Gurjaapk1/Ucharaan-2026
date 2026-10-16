# Published prototype and resumption

Live URL: https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site

Published successfully October 16, 2026. User explicitly selected anyone-with-link sharing; Sites confirmed public access. The hosted character-choice page was opened and verified after deployment.

- Site project: `appgprj_6ad297e1c9a08191a4c59d00aa49a007`
- Saved version: `appgprj_6ad297e1c9a08191a4c59d00aa49a007~appgver_a41d677268688191a9334ee1613f97f1`
- Deployment: `appgdep_6ad29b4deba88191b5ca718f8e40e103`
- Pushed Sites source commit: `74724aa8fc38718625fec4b37a1afc079b54119e`
- Team source: `prototype/` in this project, tracked as ordinary files.
- Separate Sites deployment checkout: `tmp/sites-source/`, preserved with its clean source Git history. It contains the exact deployed source. This keeps nested deployment Git metadata out of the team's project source.
- Build archive: `tmp/uchaaran-site.tar.gz`, unchanged after deployment.

## Resume a prototype revision

Edit `prototype/`, keep the mobile template protected files unchanged, and run its build, runtime, rewards and Sites worker tests. Verify affected interactions visually. Sync only reviewed source changes into the separate `tmp/sites-source/` checkout, preserving its `.git` and Site identity. Renew a Sites source credential through the connector, supply it only through the source workflow helper's hidden stdin, and build/package/push from the deployment checkout. The Site is now public, so use the audience-appropriate save/deploy operations rather than private-only publishing.

For native implementation, follow `prototype/NATIVE_INTEGRATION.md` and Avi's current skill on `feature/kids-mode`. Do not merge this browser prototype or its preview runtime into Sundar Gutka's native app as feature code.

## Team review on GitHub

The prototype and updated design documentation are shared on `codex/v1-product-journey` for Avi and the team to use as a React Native reference. Sites publication uses a separate hosting repository.

- [Prototype source and run instructions](https://github.com/Gurjaapk1/Ucharaan-2026/tree/codex/v1-product-journey/prototype)
- [React Native integration contract](https://github.com/Gurjaapk1/Ucharaan-2026/blob/codex/v1-product-journey/prototype/NATIVE_INTEGRATION.md)
- [Latest product decisions](https://github.com/Gurjaapk1/Ucharaan-2026/blob/codex/v1-product-journey/docs/12-interactive-prototype.md)
- [Design QA and verification](https://github.com/Gurjaapk1/Ucharaan-2026/blob/codex/v1-product-journey/prototype/design-qa.md)

This is the design/reference branch. Native implementation should follow Avi's branch flow from `feature/kids-mode`; do not merge the browser preview runtime into the native app.
