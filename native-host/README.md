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
