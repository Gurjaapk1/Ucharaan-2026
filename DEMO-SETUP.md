# Demo setup

Goal: run the Uchaaran Expo app on a phone and test live recitation against our pronunciation scorer.

## Scoring server: already running on Azure

```
URL:  https://uchaaran-score.gentlebush-095e8f60.westus.azurecontainerapps.io
Key:  uchaaran-demo   (header X-Api-Key)
```

Always on (Azure Container Apps, 2 vCPU). Endpoints: `GET /healthz`, `GET /v1/manifest?bani=2`, `POST /v1/score`, `POST /v1/follow`. Nothing to install or start.

Check from any machine:
```sh
curl -s https://uchaaran-score.gentlebush-095e8f60.westus.azurecontainerapps.io/healthz
```

Score a recording by hand:
```sh
curl -s -H "X-Api-Key: uchaaran-demo" -F bani=2 -F reciter=ggs -F seqs=5-10 -F audio=@recording.m4a \
  https://uchaaran-score.gentlebush-095e8f60.westus.azurecontainerapps.io/v1/score
```
Response: per line `share_like`, per word `state` = `like` | `check` | `unclear`, plus `focus` (the word to practise). Reciters: `ggs` Giani Gurdev Singh, `bjs` Bhai Jarnail Singh, `imk` Bibi Indermohan Kaur. Japji Pauri 1 = seqs 5-10, Pauri 2 = 11-16, Pauri 3 = 17-30 (all 385 Japji lines are covered; a request may span at most 30 lines). The first request for a reciter and line range not yet cached takes 5-15 s; after that 1-3 s.

## Expo app

```sh
git switch native/v1-product-journey && git pull
npm ci
EXPO_PUBLIC_SCORING_URL=https://uchaaran-score.gentlebush-095e8f60.westus.azurecontainerapps.io EXPO_PUBLIC_SCORING_API_KEY=uchaaran-demo npx expo start -c
```
Scan the QR code with the iPhone; Expo Go opens the app. If phone and Mac are not on the same Wi-Fi, add `--tunnel`. For a browser instead of a phone: `--web` (microphone works; CORS is enabled on the server).

The `EXPO_PUBLIC_*` values are baked in when Expo starts, so restart with `-c` after changing them.

## The flow to test

Settings → Kids Mode on → explorer → Japji map → a pauri → Practice (reciter audio, word highlight) → Challenge: record, recite the pauri, stop → "Checking…" → words marked like / check / unclear, one focus word with "Practise this word". Then the planted errors: say ਸੋਚਿ as ਸੋਚੀ; skip ਲਖ; stop halfway (unspoken lines come back unclear, no score is invented).

## Known limits (say them in the demo)

- Scores are against the reciter the child heard, never an average.
- Extra or substituted speech is not detected; skipped words and consonant errors are. Matra flags are "listen and compare", not verdicts.
- Flags are uncalibrated heuristics from the 2026-10-16 spike; the calibrated service is in `service/` (branch `service/scoring`).
- Audio is processed in memory and not stored.

## Running the scorer yourself (optional)

Only needed if Azure is unreachable. `demo-server/` is self-contained (Python 3.11 or 3.12, CPU):
```sh
cd demo-server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python fetch_assets.py        # ~1.1 GB download once: model + three reciters' audio
UCHAARAN_API_KEY=uchaaran-demo uvicorn demo_server:app --host 0.0.0.0 --port 8000
```
Then start Expo with `EXPO_PUBLIC_SCORING_URL=http://<your-lan-ip>:8000` (the phone must reach your machine; not localhost). The same folder has the `Dockerfile` used for the Azure image.

## If something breaks

- Azure returns 401: the `X-Api-Key` header is missing or wrong.
- Azure returns 400 on seqs: the range spans more than 30 lines.
- A 10-15 s first response for a new reciter or line range is expected; later calls are fast.
- The app shows no result: check `EXPO_PUBLIC_SCORING_URL` was set when Expo started (restart with `-c`).
