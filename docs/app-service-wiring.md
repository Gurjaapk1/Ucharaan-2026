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

1. **Begin challenge** records the whole pauri (m4a on iOS/Android, webm on web).
2. **Finish and check** makes one `POST /v1/score` (`bani=2`, `reciter=ggs`, Pauri 1 = `5-10`) and shows "Checking…" while it waits. A request that times out after 45 s is retried once.
3. Results: `like` is plain, `check` is highlighted, `unclear` is dimmed. Each line gets stars from the manifest's `star_bands`, and the `focus` word gets **Practise this word** plus the reciter's clip.
4. `status: "unclear"` or an error gives no score or coins, and the ready screen asks for a retry.

The manifest (`GET /v1/manifest?bani=2`) is fetched once per session. If it lacks a pauri's seqs, the app asks for Pauri 1 and does not upload. Seqs are 5 plus the number of lines before the pauri in `bani.json`, checked only for Pauri 1.

## Not detected

Extra or skipped speech may not be detected: the aligner assumes every word was spoken, so a skipped word shows up only as a weak `check`. Matra-quality differences (ਸੋਚਿ vs ਸੋਚੀ) separate only weakly. The screen says: "Extra or skipped speech may not be detected; listen and compare."
