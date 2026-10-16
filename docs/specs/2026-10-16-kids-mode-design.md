# Kids Mode (Uchaaran Helper): design

Status: draft for team review, 2026-10-16. Product context: `codex/v1-product-journey` docs. Running notes and evidence: `UCHAARAN-NOTES.md` (Avi's machine).

## Goal and constraints

A parent-enabled Kids Mode in Sundar Gutka where a child in grades 6-8 listens to and taps along with the first pauris of Japji Sahib, recites a pankti, and gets one word to practise, measured against an ustaad's recording.

- **Half of the rubric is how easily Khalis can merge this into `KhalisFoundation/sundar-gutka-react` `dev`.** Every choice below favours a small, isolated diff on their stack.
- Demo runs on iPhone first, then Android.
- **Parents choose the reciter.** The standard is the one voice the child listens to, never an average: the child imitates one rendering and feedback must measure distance from that rendering. For the hackathon the selectable references are the app's three Japji Sahib reciters (Bhai Jarnail Singh, Bibi Indermohan Kaur, Giani Gurdev Singh), labelled as sample material, never as an approved ustaad standard. A teammate supplies rule text and judgments, not reference audio.
- The three reciters together calibrate tolerance only: how far correct recitations naturally differ on each sound. Scoring is always child vs the chosen voice.

## Architecture

| Part | Where | Stack |
| --- | --- | --- |
| Kids Mode in the app | `src/KidsMode/` on `feature/kids-mode` | Khalis's RN 0.78 + Redux stack |
| Scoring service + ustaad page | new repo `uchaaran-service` | Python, FastAPI, torchaudio MMS forced aligner, Docker |
| Reference store | Azure Blob `uchaaranref4045/reference` | mirrors Khalis's Blob + CDN audio |
| Hosting | Azure Container Apps `cae-uchaaran`, westus | same platform as Khalis's `sttm-audio-api-v2` |

Khalis adopts this by deploying one more container next to theirs and merging a folder plus registration lines.

## App changes (merge-first)

New code lives only in `src/KidsMode/`. Existing files get registration lines only: one `kidsMode` reducer key, action types, one `Stack.Screen` per Kids screen, one `<KidsModeComponent />` in Settings, strings in `localization.js`, and microphone permission entries in `Info.plist` and `AndroidManifest.xml`. `src/ReaderScreen/**` is not modified (open Khalis PRs #397 and #400 edit it). Kids Mode is off by default; with it off the app behaves exactly as today.

Units:

1. **KidsModeComponent** (Settings): the parent switch, plus a second switch "Check my child's pronunciation online", off by default, explaining that audio is sent for scoring and not kept.
2. **Practice screen**: renders the selected panktis itself from `mv_Banis_Shabad` (Bani 2), one element per word using the same `split(" ")` indexing as `db.js`. Under each word: the transliteration from the app's existing Transliteration setting (`isTransliteration`, `transliterationLanguage`; the English scheme already drops unvoiced terminal sihari/aunkar, e.g. ਸੋਚਿ → `soch`), and a syllable respelling derived by fixed rules from the BaniDB IPA field (ਸੋਚੈ → `so-chai`), reviewed once by the ustaad. Sounds with no English approximation (ਣ, ੜ, aspirates, dental vs retroflex) show "listen" instead of a respelling. Tapping a word plays the chosen reciter's clip of it. Plays the reference track through the existing `react-native-track-player` and highlights the current word from the word timings. Taps are judged against the word's time window.
3. **Recorder**: pending the iPhone spike (see Open decisions).
4. **Challenge**: one continuous recording of a whole pauri (the prototype's chosen mode). Scored when the recording stops; the results screen shows a "checking…" state with a realistic estimate (about 1 s of compute per 1.5 s of audio on 2 vCPU). Live voice-following during recording is out of scope for V1: the aligner works on complete recordings.
5. **Feedback**: shows the pankti with the flagged word, plays the chosen reciter's clip for that word next to the child's own, shows the rule text if one exists, and offers a retry.
6. **Progress**: practice history and words to revisit, in the persisted `kidsMode` state.
7. **Scoring client**: one module modelled on `makeApiRequest` in `src/services/audioApi.js`.

Storage on the phone: recordings are `.m4a` files under `DocumentDirectoryPath/kids/` via `react-native-fs`, keeping the latest 3 per pankti; metadata lives in `kidsMode` state. Nothing is written to `gutka_v01.db`, because database updates delete and replace it. Parents can delete recordings.

## Service API

`GET /v1/manifest?bani=2` returns the available reciters and, per reciter and pankti: `seq`, reference audio URL, word list (`idx`, Gurmukhi, start/end seconds in the reference), word clip URLs, any rule text, and the star bands. The app caches it.

`POST /v1/score` (multipart: `bani`, `reciter`, `seqs` (one pankti or a whole pauri), `audio`; header `X-Api-Key`) returns per word one of three states, never a fine-grained number:

```json
{ "status": "ok",
  "lines": [{ "seq": 5, "share_like_reciter": 0.75,
              "words": [{ "idx": 0, "state": "like" }, { "idx": 1, "state": "check" }, { "idx": 2, "state": "unclear" }] }],
  "focus": { "seq": 5, "idx": 1 } }
```

`state` is `like` (within tolerance of the chosen reciter), `check` (outside it), or `unclear` (alignment too weak to judge). A line's percentage is its share of `like` words, weighted by word duration; the app maps it to stars with bands from the manifest, so thresholds are tuned server-side. The whole response is `status: unclear` (retry prompt, no score) when there is no speech, the audio is too noisy, or alignment confidence is too low overall. Scores are never invented. Acoustic distances have no calibrated meaning at 0-100 resolution, which is why the API does not expose one.

Server rules: child audio is processed in memory and never written to disk, Blob or logs; an API key plus a per-key rate limit protects the endpoint. The key is a build-time secret, not committed (Khalis's committed empty basic-auth password is not a pattern to copy).

## Scoring method (provisional: under adversarial review, see Evidence)

Principle: a spectrum mixes what was said with who said it, the microphone and the speed. A child's formants sit 15-20% above an adult man's. So the service never compares raw spectra; it uses a speech model only for the one thing analytic features cannot do, which is to compare sounds across different voices.

1. **Alignment.** Force-align the recording to the known text with the MMS aligner (torchaudio `MMS_FA`, CTC over Roman letters). The text is spelled the way the model was trained on (uroman-style letters) but following the recitation convention of BaniDB's English transliteration, which drops unvoiced terminal sihari/aunkar. Output: a time span and a confidence per word.
2. **Missed or wrong word (heuristic).** A word whose confidence falls far below the chosen reciter's confidence on the same word is marked `check`. The aligner assumes every word was spoken, so a skipped word is squeezed into a sliver with collapsed confidence rather than reported missing.
3. **Sound comparison.** The child's word and the reciter's clip are compared with dynamic time warping over cosine distance on the model's layer-12 features, after subtracting each recording's mean feature (per-speaker centring). Tolerance per sound is a pooled magnitude calibrated from the three Japji reciters, scaled by word length, applied to whichever reciter the parent chose.
4. **Vowel duration.** For each vowel, its duration as a fraction of its word, child vs reciter. Within-word ratios are speaker- and speed-invariant, and DTW discards duration, so this check covers matra length and addak.
5. **Consonant check.** The text-based alignment score (goodness of pronunciation) catches gross consonant swaps (ਲਖ said as "rakh").
6. **Decision.** A word is `check` if any of 2, 3 (with 4) or 5 exceeds its band; `unclear` if alignment confidence for the word is below the floor. `focus` is the `check` word with the largest margin.

Calibration: the `check` threshold is set so that correct recordings by amateur adults and children are flagged on at most 10% of words, and that rate is reported. Until such recordings exist (teammates and children, phone microphone, quiet room: a correct pauri, a one-matra error, a skipped word), the sound-comparison layer is unvalidated and the spec says so.

## Evidence so far (2026-10-16, spike-align/, Pauri 1, three reciters)

- Alignment: 58 words of the salok and Pauri 1 in order, 0.08-0.76 s each, pauses between words; 47 words of Pauri 1 aligned as one block per reciter.
- Miscue heuristic: ਲਖ confidence 0.80-0.97 intact, 0.12-0.25 with its audio deleted, 0.19-0.58 with another word's audio in its place.
- Text-based confidence does not see matra swaps (ਸੋਚੈ→"sochi" barely moves) but sees consonant swaps (ਲਖ→"rakh": GOP 0 → -2.2 for all three reciters). Caveat under review: these numbers used BaniDB spelling, not the uroman spelling the model was trained on.
- Sound comparison: same word across reciters vs matra minimal pairs, separation d′ = 2.20 with layer-12 centred features; the honest matra pair ਸੋਚਿ/ਸੋਚੀ separates at d′ ≈ 3 (confidence interval pending). Analytic features (MFCC or log-mel with normalisation, DTW) reach d′ ≈ 1.3 on pooled pairs and are negative on the honest pair: they detect vowel presence, not quality.
- Phonology (sourced by the review): Punjabi short/long vowel pairs differ primarily in quality, with duration secondary; addak gemination lengthens the consonant by about 40% and shortens the following vowel; aspiration survives in heritage children while voiced stops devoice; English listeners merge dental and retroflex.
- Not reusable: Azure pronunciation assessment covers Hindi but not Punjabi, and would replace the reciter's standard with Microsoft's.

## Ustaad page

Served by the same service at `/ustaad`. The ustaad picks a pankti, records it, the aligner cuts word clips, and the page shows each clip for approval or re-recording. A person types any English rule per word; the system never writes pronunciation rules. Approved material is published to `reference/<bani>/<seq>/` (`pankti.m4a`, `words/<idx>.wav`, `rules.json`) and appears in the manifest.

## Hosting

- Container Apps, Consumption profile, 2 vCPU / 4 GiB, scale 0-1. Set minimum replicas to 1 for test sessions and the demo, then back to 0.
- The model (~1.2 GB) is kept out of the image and loaded from an Azure Files mount at startup; a startup probe allows for the load time.
- The app shows "This may take a moment" and retries once on timeout.
- Budget: the monthly free grant covers about 25 hours of a running 2 vCPU replica; beyond that the $100 student credit pays about $0.20 per hour.

## Testing

- App: Jest tests next to every new component, hook and utility, per Khalis CONTRIBUTING; `yarn lint` and `yarn test` pass.
- Service: pytest for alignment output shape, the `unclear` paths, and that no audio is persisted.
- Validation: word timings checked against hand marks on Pauri 1; scores checked against a human judge on the test set. Results are reported as observed, including failures.

## Delivery

Team works on `Gurjaapk1/Ucharaan-2026` in `kids/<piece>` branches merged daily into `feature/kids-mode`. Hand-off to Khalis is a series of small PRs from the fork `avioberoi/sundar-gutka-react` into their `dev`:

1. Kids Mode switch and scaffolding
2. Practice screen with tap-along
3. Recording, scoring client and feedback
4. Progress and parent summary

`AGENTS.md`, `CLAUDE.md` and `.agents/` are removed before these PRs.

## Open decisions

| Decision | Current lean | Settled by |
| --- | --- | --- |
| Recorder | MediaRecorder inside the existing `react-native-webview`, loaded from the service's https URL (no new native dependency); fallback `react-native-nitro-sound` | iPhone spike: record after a track has played |
| Scoring validation | method above | correct and deliberately wrong phone recordings from teammates, then children |
| Matra-aware text scoring | an IPA-based phone model, since BaniDB already ships IPA per line | models review: does an open IPA recogniser cover Punjabi sounds |
| TypeScript inside `src/KidsMode/` | `.jsx` unless `.tsx` compiles and lints in the Khalis repo with zero config change | platform review |
| Other half of the rubric | unknown | Avi |
| Ear check of word clips | pending | Avi, `spike-align/clips/ggs/` incl. `bhee` and `kiv` |
