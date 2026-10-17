# How the pronunciation scorer was chosen and built

Written 2026-10-16 after one day of measurement. Every number below was produced on the three Japji Sahib recordings that ship with Sundar Gutka (Giani Gurdev Singh, Bhai Jarnail Singh, Bibi Indermohan Kaur), Pauri 1 unless stated. Scripts and logs: `spike-align/` on Avi's machine; agent reports under `agent-outputs/2026-10-16-uchaaran-*`.

## The question

The brief asks for word-level feedback measured against an ustaad's recording, and rules out "transcribe the child and compare spellings": Gurbani has terminal sihari and aunkar that are written but not spoken, so a spelling comparison marks correct recitation wrong. We needed a method that (1) finds each word in the child's audio, (2) judges it against the reciter the child heard, and (3) says "unclear" rather than inventing a number.

## From first principles

A recording's spectrum mixes what was said with who said it, the microphone and the speed. A child's vocal tract is shorter than an adult's, so every formant sits higher; a phone mic adds its own colour. Matching raw spectra of child and ustaad would measure the speaker and the channel, not the pronunciation. We tested the analytic route anyway (MFCC / log-mel with channel normalisation, dynamic time warping): on the honest matra pair ਸੋਚਿ vs ਸੋਚੀ, every analytic variant put the two different words *closer* than the same word across two correct reciters (d′ ≤ 0). A trained speech model is needed for exactly one thing: knowing that two different spectra are the same sound from different mouths.

So the design is: **known text + forced alignment** (find the words), then **per-word goodness-of-pronunciation** (how strongly the model's frame-by-frame token probabilities favour the expected sounds), judged against the chosen reciter.

## Choosing the model (bake-off, five candidates)

Same audio, same tests: alignment sanity against hand-checked word clips; planted errors (matra swaps such as ਸੋਚੈ→ਸੋਚਿ, consonant swaps such as ਲਖ→ਰਖ, voiced terminal vowels); a deleted word; false flags on correct speech; CPU speed.

| Model | Matra swaps caught | Terminal-vowel rule | Consonant swaps | Time per 27 s pauri (CPU) | Licence |
| --- | --- | --- | --- | --- | --- |
| w2v-BERT Punjabi (`kdcyberdude/w2v-bert-punjabi`) | 83% | 100% | 100% | 44 s | CC-BY-4.0 |
| IndicConformer trained on Gurbani (`surindersinghssj/indicconformer-pa-v3-kirtan`) | 88% | 0% | 100% | 3.2 s | Apache-2.0 |
| MMS 1B + Punjabi adapter | 88% | 89% | 100% | 19 s | non-commercial |
| MMS forced aligner (Roman letters) | 25% | 11% | 20% | 7 s | non-commercial |
| IPA phone model (xlsr-53-espeak) | 17% | 0% | 73% | 15 s | Apache-2.0 |

Decision: **the Gurbani-trained IndicConformer runs the demo** (fast, permissive, trained on 480 h of Gurbani, no name-matched overlap with our three reciters across 516 training videos); **w2v-BERT is the production scorer** once it has an int8/ONNX export or a GPU, because it is the only commercially usable model that scores the recited form over the written one and can police the silent-sihari rule. The Roman-letter aligner we started with is nearly blind to matras and is non-commercial, so it was dropped.

What no model could do: hear a dropped word-final ਾ (ਸਿਆਣਪਾ→ਸਿਆਣਪ) or detect extra speech the text does not contain. Those are stated limits, not bugs to fix tonight.

## Design decisions the evidence forced

- **One reciter as the target, never an average.** The child imitates one voice; feedback must mean distance from that voice. Parents choose the reciter. The other reciters only calibrate tolerance.
- **Recited-form text.** All three reciters drop terminal sihari/aunkar (33 of 36 words), and the models punish the written form (recited beats written in 15/15 cells on the speech-faithful models). The alignment text follows BaniDB's transliteration convention, including the ਹੋਹਿ case, which the first rule got wrong.
- **Three states per word, no 0-100.** `like` / `check` / `unclear`. Acoustic distances have no calibrated meaning at finer resolution. A line's percentage is the share of `like` words; stars come from bands in the manifest so thresholds can move server-side.
- **Missed words are a region, not a point.** Deleting ਲਖ collapses its confidence (0.9 → 0.1-0.25) but also dents a neighbour in 5 of 12 cases.
- **Matra quality is "listen and compare", not a verdict.** With honest sample sizes the audio-to-audio comparison separates vowel quality only weakly (d′ ≈ 0.8); text scoring on a Gurmukhi-token model does better, which is why the model choice mattered more than the comparison method.
- **Unclear beats invented.** Silence, a clip under a second, or more than half the words unaligned returns `unclear` and no score.

## The demo server

`demo-server/` (and the same image on Azure Container Apps): FastAPI around the tested command-line scorer. `POST /v1/score` takes a recording, reciter and line range and returns per-line share and per-word states plus a focus word; `POST /v1/follow` takes the recording-so-far and returns how far the child has got, for live word highlighting (2-3 s per 20 s of audio on 2-4 CPU threads). Audio is decoded in memory and never stored. Flags are uncalibrated heuristics from today's spike; the calibrated service with tests is `service/` on branch `service/scoring`.

## What is still unvalidated

Everything above was measured on three adult professionals in studio conditions. No child's voice and no phone-microphone recording of a correct recitation has been scored yet; the first one is the real test of the false-flag rate. The 10% false-flag target is a target.
