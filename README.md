# Uchaaran

A Gurbani learning experience for children, built around pronunciation, understanding, and a journey through Japji Sahib.

[Try the live app](https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site) · [Explore the design process](https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0)

## This edition

A clean source snapshot of Site version 25, saved October 17, 2026. This branch contains the complete Expo app, bundled artwork, the Site scoring proxy, and product documentation. It does not change main or the existing product branches.

- Six illustrated regions covering all 38 pauris.
- Practice with Gurmukhi, Romanized pronunciation, and English meanings.
- Memory walks, panorama previews, and Gurmukhi recall choices.
- Real Azure scoring with manual line completion and word feedback.
- Prem Singh and Sehaj Kaur, with clothing, belongings, actions, and Nanak coin rewards.
- Saved progress and equipment, with a separate demo wardrobe.

## Run the web app

Install a current Node.js LTS release, then run from this branch's root:

```sh
npm ci --prefix native-app
node native-host/build.mjs
node native-host/preview.mjs
```

The preview asks for a JSON object through hidden standard input. Enter `{}` to explore the interface without scoring. For scoring, supply `KIDS_SCORING_URL` and `KIDS_SCORING_API_KEY` from the team's runtime configuration. The browser opens at http://localhost:4186. No credentials are included in this branch.

The deployed Site stores its API key as a server-side secret. Its browser calls `/api/scoring`; the Worker forwards authorized requests to Azure. The `.openai/hosting.json` identifies the existing Site, so use a new Site identity before deploying a fork elsewhere.

## Work on the native app

```sh
cd native-app
npm start
```

The app uses Expo, React Native, and TypeScript. Native development reads `EXPO_PUBLIC_SCORING_URL` and `EXPO_PUBLIC_SCORING_API_KEY`, as inherited from the native branch. Public Expo variables are bundled into the client and must not contain a production secret. The web build uses the server proxy instead.

## Check the code

From the branch root:

```sh
./native-app/node_modules/.bin/tsc -p native-app --noEmit
node native-host/check-rewards.mjs
node --test native-host/worker.test.mjs
```

The snapshot passed type checking, eleven reward/progress behavior tests, scoring-proxy tests, and browser checks for purchase, reload, demo isolation, pronunciation, and recall. Physical-device microphone behavior needs device testing.

## Find your way around

| Folder | Contents |
| --- | --- |
| `native-app/src/KidsMode` | Journey, practice, challenge, rewards, and local experience state |
| `native-app/src/host` | Native audio, images, icons, and platform adapters |
| `native-app/src/scoring` | Scoring client and service response handling |
| `native-app/assets` | Bundled fonts and illustrations |
| `native-host` | Web build, local preview, server proxy, and checks |
| `docs` | Product decisions and implementation handoff |

Earlier numbered product documents capture the design's evolution; this README and `docs/native-site/product-parity.md` describe the current snapshot.

## Provenance

- Live Site source: `1ccfb9a047fd3e8e70057d70ad50e87e8fe7d777` (version 25).
- Native foundation: `native/v1-product-journey`, commit `eaaa3c1`.
- Product design source: `codex/v1-product-journey`, remote commit `e524d4e`, plus subsequent local handoff documentation through `7e3464b`.
- Team 12: Avi Oberoi, Gurjaap Kalra, Mohkm Singh, and Gurasees Bajaj, working with Khalis Foundation.

This branch preserves source and documentation. Site runtime credentials, recordings, generated builds, local caches, and demo-video exports are intentionally excluded.
