# Demo setup (for Gurjaap's machine and his agent)

Goal: serve the Uchaaran Expo app and our pronunciation-scoring server on one Mac, test live recitation from an iPhone.

## 1. Scoring server (Python 3.11, CPU only)

```sh
git pull                      # branch main
cd demo-server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python fetch_assets.py        # ~480 MB model from Hugging Face + 3 reciters' Japji audio from Khalis's CDN (~60 MB)
UCHAARAN_API_KEY=uchaaran-demo uvicorn demo_server:app --host 0.0.0.0 --port 8000
```

Check: `curl -s localhost:8000/healthz` → `{"ok": true, ...}`. First request loads the model (~30 s); then ~3-5 s per pauri.

Score a file by hand:
```sh
curl -s -H "X-Api-Key: uchaaran-demo" -F bani=2 -F reciter=ggs -F seqs=5-10 -F audio=@recording.m4a localhost:8000/v1/score
```
Response: per line `share_like` and per word `state` = `like` | `check` | `unclear`, plus `focus` (the word to practise). Reciters: `ggs` Giani Gurdev Singh, `bjs` Bhai Jarnail Singh, `imk` Bibi Indermohan Kaur. Japji Pauri 1 = seqs 5-10.

## 2. Expo app

```sh
git switch native/v1-product-journey && git pull
npm ci
EXPO_PUBLIC_SCORING_URL=https://increase-pressing-officials-aged.trycloudflare.com EXPO_PUBLIC_SCORING_API_KEY=uchaaran-demo npx expo start -c
```
That URL is the scoring server already running on Avi's laptop tonight (verified from outside). Open in Expo Go on the iPhone. To serve the scorer on the Mac instead (section 1), use `EXPO_PUBLIC_SCORING_URL=http://<mac-lan-ip>:8000` with the Mac's LAN IP, not localhost: the phone must reach the server.

## 3. The flow to test

Settings → Kids Mode on → explorer → Japji map → Pauri 1 → Practice (reciter audio, word highlight) → Challenge: record, recite the pauri, stop → "Checking…" → words marked like / check / unclear, one focus word with "Practise this word". Then the planted errors: say ਸੋਚਿ as ਸੋਚੀ; skip ਲਖ.

## Known limits (say them in the demo)

- Scores are against the reciter the child heard, never an average.
- Extra or substituted speech is not detected; skipped words and consonant errors are. Matra flags are "listen and compare", not verdicts.
- Flags are uncalibrated heuristics from the 2026-10-16 spike; the calibrated service is in `service/` on branch `service/scoring`.
- Audio is processed in memory and not stored.

## If something breaks

- Server import error about `IndicConformer`/`MMSFA`: the scorer files must be the ones in `demo-server/`, unmodified.
- Model download fails: set `HF_HOME` to a folder with space and rerun `fetch_assets.py`.
- Phone cannot reach the server: check the Mac firewall allows port 8000, or use the tunnel route above.
- No app yet on `native/v1-product-journey` with the client: the client lives on `app/service-client` until merged; `git switch app/service-client` instead.
