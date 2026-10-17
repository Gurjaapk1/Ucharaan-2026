# Demo setup

Use `native-app/` for the current experience. It has six region panels, pronunciation aids, rewards, and real line-by-line scoring. The earlier `prototype/` is a visual reference with simulated scoring.

Follow the root [README](README.md) to install, build, and preview. The live web app is https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site . The narrated demo is https://www.loom.com/share/8f0b7638963c4f4588720084fd15776c .

Scoring requires the service URL and a deployment secret. Get these through the team's private handover; do not paste keys into code or committed commands. Server configuration is listed in `.env.example` and `demo-server/.env.example`.

## User flow

1. Open Settings and turn on Kids Mode.
2. Choose Prem Singh or Sehaj Kaur, then open Japji Sahib.
3. Choose a pauri from one of the six regions.
4. Practice with Gurmukhi, pronunciation, English meaning, and reference audio.
5. Start Challenge, allow microphone access, and recite one line.
6. Tap Done with line. Wait for scoring, then continue with the next line. Retry unclear audio without losing earlier completed lines.
7. Review word feedback and return to practice. New stars award Nanak coins; Rewards offers clothing, belongings, and actions.

## Service checks

`GET /healthz` confirms a loaded service. `GET /v1/manifest?bani=2` lists reciters and bands. A health response alone does not establish scoring accuracy. Test a permitted reference clip, silence, and a retry before the demonstration.

Current word states are `like`, `check`, and `unclear`. The percentage is agreement among judged words, not a calibrated pronunciation grade. The service's word-clip map is currently empty, so individual word playback may not be available.

See [ML production guide](docs/engineering/ml-production.md), [privacy](docs/engineering/privacy.md), and [validation](docs/engineering/validation.md) for deployment and evidence limits.
