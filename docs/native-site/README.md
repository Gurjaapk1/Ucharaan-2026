# Native branch on ChatGPT Sites

Source: `Gurjaapk1/Ucharaan-2026`, branch `native/v1-product-journey`, commit `eaaa3c1`.

The branch's Expo app, source, bundled assets and pinned dependencies are in `native-app/`. The prior browser prototype remains in this source repository for recovery. The deployed entrypoint is now Expo's React Native Web build, with a centered 520px canvas on desktop.

Site-specific changes:

- Browser scoring uses `/api/scoring`. The Worker forwards only supported health, manifest, score, follow and reference routes to Azure.
- `KIDS_SCORING_URL` and secret `KIDS_SCORING_API_KEY` are runtime settings held by Sites. No key is placed in source or client bundles.
- Default scoring reciter is `bjs`, matching the Bhai Jarnail Singh practice recording.
- Recording disclosure names the Azure upload. No microphone is requested on launch.

Run `node native-host/build.mjs` from the repository root after installing `native-app` dependencies. The export writes `dist/client`, `dist/server/index.js`, and the hosting manifest. Deploy that output with the Sites workflow. `node native-host/preview.mjs` accepts a JSON configuration via hidden stdin for local QA; do not put credentials into files.

The branch uses line-by-line recording and checking, rather than continuous voice-position detection. It returns word-level feedback and then starts the next line. This preserves the selected branch's behavior.

Azure smoke tests: health reports indicconformer; manifest lists ggs/bjs/imk with star bands 60/80/95; silence returns unclear; a known Bhai Jarnail Singh line returns per-word results. These verify transport and response handling, not accuracy calibration. The manifest currently has an empty `lines` object, so individual word-reference clips are unavailable.

The service provider is tracked independently of line-following mode so upload disclosure stays accurate. Cancelling a challenge stops recording without scoring, and retrying a failed line preserves prior line scores.

## Published verification

Sites version 22 is live at https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site . Site source commit: `0d294785d883cbb72cbffcdd285a6086db7b5224`. Azure runtime configuration revision 1 holds the endpoint and secret key.

Verified through the public Site: health reports `indicconformer`; a Bhai Jarnail Singh reference-line WAV sent through `/api/scoring/v1/score` returns per-word states and a focus word. The reference fixture returned 87.5 percent, which underscores that this is not a calibrated accuracy claim. Silence returned unclear through the local proxy. Controlled browser audio streams advanced from line 1 to line 2 after live Azure responses, both locally and on the published public Site. The public browser test reported no page errors. Physical microphone quality remains for human testing.

The edge runtime supports redirect mode `manual`, not Node's `error`; the proxy explicitly rejects redirects. Unit tests cover route restriction, origin checks, missing configuration and forwarding without exposing the key. Typecheck, Expo web export and the preserved 28-file prototype runtime check passed.

Known branch differences: the native branch uses its own character rewards and map implementation and line-by-line scoring. This is not a merge of every later web-only design. The prior prototype is retained in the Site source, while the current public entrypoint uses the requested native branch.

## Expanded rewards

Version 24 ports the Codex wardrobe to the native app. See [product comparison](product-parity.md) for remaining differences. `rewards-port.patch` applies after `native-web-adjustments.patch` to the native source under `native-app/`; it includes the reward artwork. Copy `scripts/native-site/check-rewards.mjs` and `reward-tests/` into the Site's `native-host/` and run `node native-host/check-rewards.mjs` from the Site checkout. The Site source commit is f9648475409aa30de805167d9f3679bf524b6f07.

## Learning aids

Version 25 adds the Codex pronunciation aids for all 374 lines in practice and story views, actual Gurmukhi phrases in the recall picker, and reflection-only picture explanations. Apply `learning-aids.patch` after `rewards-port.patch`. Six region panels and manual line completion with Azure scoring are retained by explicit user preference. Native typecheck and mobile browser checks pass. Original Gurmukhi, translations, audio/scoring timestamps, map code, and challenge/results code are unchanged.
