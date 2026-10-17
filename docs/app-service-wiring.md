# App to scoring service

`USE_SERVICE` in `src/scoring/config.ts` (default `true`) scores the challenge on the team's service. Set it to `false` to use the on-device MFCC scorer instead.

## Mock

```sh
EXPO_PUBLIC_SCORING_MOCK=1 npx expo start -c
```

No network needed: every word comes back `like` except one `check`. Clips do not play.

## Live service

Set these inline or in `.env.local`, and never commit the key:

```sh
EXPO_PUBLIC_SCORING_URL=https://<host> EXPO_PUBLIC_SCORING_API_KEY=<key> npx expo start -c
```

Expo bakes `EXPO_PUBLIC_*` into the bundle, so keep `-c`.

## Recording flow

1. **Begin challenge** records the whole pauri (m4a on iOS/Android, webm on web). Where the microphone can also stream PCM, `src/host/followedRecitation.ts` keeps a 16 kHz copy and every 2 s (skipped while one is in flight, 8 s timeout, no retry) posts the recording so far as a WAV to `POST /v1/follow`. Reached words turn `like` (green), `check` (highlighted) or `unclear` (dimmed); the reached word is shaded and the view keeps one line above it. A 404/405 stops following for that attempt; no stream means the plain flow below.
2. **Finish and check** stops following and makes one `POST /v1/score` (`bani=2`, `reciter=ggs`, Pauri 1 = `5-10`); its result replaces the live states and shows "Checking…" while it waits. A request that times out after 45 s is retried once.
3. Results: `like` is plain, `check` is highlighted, `unclear` is dimmed. Each line gets stars from the manifest's `star_bands`, and the `focus` word gets **Practise this word** plus the reciter's clip.
4. `status: "unclear"` or an error gives no score or coins, and the ready screen asks for a retry.

The manifest (`GET /v1/manifest?bani=2`) is fetched once per session. Every pauri is sent; seqs are 5 plus the number of lines before the pauri in `bani.json` (Pauri 2 = `11-16`, Pauri 3 = `17-30`). That offset matches the service's `japji.json` text line for line for seqs 5-60 (Pauris 1-7); for Pauris 8-38 only the count is checked (378 + 7 closing-salok lines = the 385 reciter timing entries).

## Not detected

Extra or skipped speech may not be detected: the aligner assumes every word was spoken, so a skipped word shows up only as a weak `check`. Matra-quality differences (ਸੋਚਿ vs ਸੋਚੀ) separate only weakly. The screen says: "Extra or skipped speech may not be detected; listen and compare."
