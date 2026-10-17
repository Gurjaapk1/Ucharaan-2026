# Operating and updating the pronunciation scorer

This is the productionization handover for Khalis. The current software is a working demonstration with uncalibrated scoring thresholds, not a validated child-pronunciation assessment. This guide separates the runnable service from the validation and operating work needed for a public release.

## Model and inputs

| Component | Current implementation |
| --- | --- |
| Model | `surindersinghssj/indicconformer-pa-v3-kirtan` |
| Downloaded export | `onnx-pa-only/fp32/indicconformer-pa-ctc.onnx` |
| Tokenizer | Punjabi SentencePiece tokenizer extracted from the model's `.nemo` archive |
| Runtime | ONNX Runtime CPU, with PyTorch/torchaudio for preprocessing and forced alignment |
| Audio | Decoded by ffmpeg to 16 kHz mono samples |
| Reference | Selected ustaad's Japji Sahib track and sequence timings |
| Output | Per-word `like`, `check`, `unclear`; line agreement share; optional focus word |
| License | Upstream model card declares Apache-2.0; project-original code is MIT |

The [upstream model card](https://huggingface.co/surindersinghssj/indicconformer-pa-v3-kirtan), checked October 17, 2026, describes a 120M-parameter Gurbani-tuned model and a mobile export path. The fetch script expects a roughly 482 MB FP32 ONNX file and downloads a separate archive to obtain its tokenizer. Mobile packaging is an option, but size alone does not establish acceptable phone memory or latency.

The model card changes over time. Do not treat upstream ASR error rates as measurements of this pronunciation scorer. The repository's [model-selection write-up](../scoring-writeup.md) reports a small adult-reference experiment and describes an alternative w2v-BERT direction. It does not prove that the alternative is deployed or production-ready. This branch's executable service loads IndicConformer.

## How a score is produced

1. Validate reciter and expected BaniDB sequence range.
2. Decode the uploaded audio into 16 kHz mono samples.
3. Reproduce the model's audio features in `bake_indicconformer.py`: 80 mel bands, 400-sample window, 160-sample hop, 512-point FFT, pre-emphasis, log transform, and per-feature normalization.
4. Run the ONNX model to produce token log probabilities.
5. Force-align the known recited-form text to those probabilities. This uses the expected passage; it is not unrestricted transcription followed by spelling comparison.
6. Compare each aligned word with the chosen reciter's reference values. The server caches reference calculations to reduce repeated inference.
7. Apply the heuristics in `phone_score.flag`: low relative confidence can flag a missed word, a reference-to-attempt GOP gap can flag a word to check, and very low confidence is unclear. Preserve evaluation fixtures when changing their order or constants.
8. Return word states and the fraction of judged words marked `like`. Silence or predominantly unaligned speech returns `unclear`.

The current heuristic constants include 0.35 times reference confidence, a GOP gap of 1.5, and an absolute confidence threshold of 0.15. They are not universal pronunciation standards. The ustaad's judgment should set the acceptance criterion.

## Run the server

Use Python 3.11 or 3.12. From the repository root:

```sh
cd demo-server
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python fetch_assets.py
# Set UCHAARAN_API_KEY securely in your environment before the next command.
uvicorn demo_server:app --host 0.0.0.0 --port 8000
```

The service now refuses to start without a non-placeholder API key. `.env.example` lists variable names; no dotenv loader is implicit. The fetch requires network access for model files and reference audio, with about 1.1 GB downloaded on a cold setup. Do not include the downloaded model and recordings in the submission ZIP.

For a container:

```sh
docker build -t uchaaran-scorer:submission demo-server
docker run --rm -p 8000:8000 -e UCHAARAN_API_KEY uchaaran-scorer:submission
```

The Dockerfile downloads model/reference assets during build. An inference container should not need to fetch them for each request. After startup, inspect `/healthz` and `/v1/manifest`, then score a permitted reference clip. Do not log the request body or paste a private recording into tickets.

## Deploy in a Khalis environment

The container can run behind a gateway in Khalis-managed Azure, AWS, or a comparable private environment. The existing demo documentation describes a 2-vCPU deployment; treat that as a starting point, not a capacity guarantee.

Before public traffic:

- Put TLS and authenticated access in front of the API. Replace the shared demo key with managed credentials. Keep server keys out of mobile binaries and web bundles.
- Limit request bytes and audio duration, restrict CORS to approved web origins, and set request timeouts. The demo currently permits all CORS origins and does not implement per-user rate limiting.
- Bound concurrent work. The Python inference lock serializes key operations; measure throughput before adding workers, because each worker may load its own large model.
- Use ephemeral temporary storage. Validate deletion on success, exceptions, disconnects, process termination, and restart. See [privacy](privacy.md).
- Set readiness checks and a health probe. Alert on error rate, p95 latency, memory exhaustion, queue depth, and unusually high unclear rates. Never include child audio or personal identifiers in metrics.
- Measure actual CPU, memory, requests, registry storage, logs, and egress before committing to a monthly cost. There is no verified cost estimate in this handover.

## Freeze a reproducible release

`requirements.txt` pins several critical packages, including torch/torchaudio 2.5.1, because the implementation uses their forced-alignment API. Some download/build dependencies remain unpinned. `fetch_assets.py` also follows the upstream model repository rather than an immutable revision. These are release tasks, not solved by the code ZIP.

For each production candidate, record:

- Git commit and container image digest.
- Exact dependency lock and Python/runtime versions.
- Model repository revision, ONNX checksum, tokenizer checksum, and corresponding license/model card.
- Reference-audio and timing checksums, with permission to use them.
- Thresholds, text-normalization rules, and the version of the evaluation set.

Store this release manifest with the deployment. Never update a tokenizer independently of its model. If the model or timing data changes, rebuild reference-cache values rather than mixing old values with a new model. Keep the prior image and manifest available for rollback.

## Validate with learners before release

The existing experiment used professional adult reciters. The current repo does not contain a representative, consented dataset of children's phone recordings. Line-by-line interaction reduces the amount to repeat, but does not establish accuracy or lower pressure by itself.

With Khalis and an ustaad, define a held-out evaluation set covering correct recitation, deliberate word omissions, vowel/consonant differences, slow/fast delivery, silence, noise, accents, and ordinary device microphones. Obtain consent and define retention separately for any evaluation dataset; the demo's transient-processing policy is not permission to collect training data.

Have qualified reviewers label words independently, resolve disagreements, and keep tuning examples separate from acceptance examples. Report false flags on correct words, missed errors, unclear rate, latency, and breakdowns by speaker/device/condition. Set acceptance thresholds with Khalis before viewing final test results. The existing 10% false-flag discussion is a target, not an achieved result.

Test the current known limits: extra/substituted speech, written-versus-recited terminal vowels, neighbor effects after a skipped word, and voice differences between child and reference. When the system is uncertain, show a short retry/listening prompt rather than a confident correction.

## Update and rollback procedure

1. Create a branch and record the baseline release manifest and evaluation results.
2. Change one model, normalization, reference, or threshold component at a time.
3. Rebuild assets and caches; run API, privacy, alignment, and app contract checks.
4. Evaluate on the held-out set and compare both accuracy and child-facing feedback burden.
5. Have the technical owner and Khalis content reviewer approve the candidate.
6. Deploy to a private test environment, then a small pilot. Monitor latency, failures, and unclear-rate changes.
7. Roll back by redeploying the prior image digest and matching configuration/cache set. Do not silently overwrite model files in a running release.

## Fully local processing option

Package the ONNX model, tokenizer, preprocessing, forced alignment, and reference data with a mobile-compatible inference runtime. This removes the scoring upload and keeps the recording on the device. The current JavaScript MFCC/DTW path is not a substitute for this model integration.

Benchmark cold start, peak memory, battery, app size, and line latency on the oldest supported iOS/Android devices. Test quantization against the same held-out pronunciation set before accepting size reductions. Verify airplane-mode inference and local recording cleanup. Reference downloads, analytics, and crash reporting must also respect the intended offline boundary.

## Ownership handover

Khalis should name a service owner for secrets, billing, monitoring, and incidents; an ML maintainer for releases and evaluation; and a Gurbani reviewer for text, reference recordings, and feedback quality. Team 12 provides this source and documentation. Named ongoing ownership and monthly cost are not yet agreed.
