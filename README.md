# Uchaaran

A Gurbani pronunciation and learning experience for children, built with Khalis Foundation.

[Live app](https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site) · [Demo video](https://www.loom.com/share/8f0b7638963c4f4588720084fd15776c) · [Design process](https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0)

Team 12: Avi Oberoi, Gurjaap Kalra, Mohkm Singh, and Gurasees Bajaj.

## What the app does

Children choose Prem Singh or Sehaj Kaur and explore 38 Japji Sahib pauris across six regions. Practice combines Gurmukhi, Roman-letter pronunciation, English meaning, reference audio, and connected visual memory cues. In Challenge, the child records one line and taps Done. The private scoring service returns simple word-level feedback. New stars earn Nanak coins for clothing, belongings, and character actions.

This submission contains the current Expo app and the scoring server source. `prototype/` preserves the earlier browser-only design reference; it is not the current app. The current app is in `native-app/`.

## Run the current app

Use Node.js compatible with the included Expo SDK and lockfile, then run from the repository root:

```sh
npm ci --prefix native-app
node native-host/build.mjs
node native-host/preview.mjs
```

The local preview prompts for configuration through hidden standard input. Enter `{}` to explore without scoring, or provide a JSON object containing `KIDS_SCORING_URL` and `KIDS_SCORING_API_KEY` from your deployment administrator. Open http://localhost:4186. No real credentials are distributed in the submission tree.

For an Expo device preview:

```sh
cd native-app
npm start
```

See `native-app/.env.example` for native-only configuration. Expo public variables are bundled into the app; do not use a long-lived production secret there. The web app uses a server-side proxy instead.

## Read the handover

| Start here | What it explains |
| --- | --- |
| [Architecture](docs/engineering/architecture.md) | How the app, recording adapter, scoring client, proxy, and service fit together |
| [ML production guide](docs/engineering/ml-production.md) | Exact model, preprocessing, deployment, calibration, updates, rollback, monitoring, and ownership |
| [Privacy and audio lifecycle](docs/engineering/privacy.md) | Temporary files, deletion, hosting boundaries, and on-device processing |
| [API contract](docs/engineering/scoring-api.md) | Inputs, response meanings, errors, and line indexing |
| [Organizer feedback](docs/engineering/feedback.md) | Line-by-line practice and simpler feedback, with implementation pointers |
| [Validation](docs/engineering/validation.md) | Reproducible checks and limits of the evidence |
| [Submission package](docs/engineering/submission.md) | How to generate the code ZIP and what is included |
| [Model-selection evidence](docs/scoring-writeup.md) | The team's original model comparison and its limitations |

Earlier numbered documents in `docs/` record the product's development. Current behavior is documented above and in [product parity](docs/native-site/product-parity.md).

## Check the implementation

```sh
./native-app/node_modules/.bin/tsc -p native-app --noEmit
node native-host/check-rewards.mjs
node --test native-host/worker.test.mjs
python3 -m unittest discover -s demo-server/tests -v
python3 scripts/check_submission.py
```

These checks cover type consistency, progress persistence, reward purchases and unlocks, the web proxy, and temporary audio deletion on success and failure. They do not measure pronunciation accuracy on children. Follow the ML production guide before a public rollout.

## Project layout

```text
native-app/       Current Expo / React Native application and bundled artwork
native-host/      Web export, local preview, Site scoring proxy, behavior checks
demo-server/      Python scoring API, Dockerfile, model and reference-asset fetcher
docs/engineering/ Current technical and nonprofit handover
prototype/        Earlier browser design reference
outputs/          Design and submission artifacts, not required at runtime
scripts/          Submission verification and ZIP packaging
```

## Hosting and license

Khalis can operate the container in its own Azure, AWS, or comparable environment. The current web app was deployed as Site version 25; this PR packages its source without changing that live deployment. The Site project ID in `.openai/hosting.json` belongs to the existing demo. Replace it for a new Site.

Original Team 12 code is [MIT licensed](LICENSE). Model weights, reciter audio, fonts, and third-party assets retain their own terms; see [notices](THIRD_PARTY_NOTICES.md). The repository previously contained a shared demo credential. It is removed from the current submission tree, but remains in Git history and should be rotated by the deployment owner.
