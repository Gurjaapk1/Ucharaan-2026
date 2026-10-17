"""Candidate 1: surindersinghssj/indicconformer-pa-v3-kirtan, ONNX CTC export (onnx-pa-only/fp32)
via onnxruntime. Features reproduce NeMo AudioToMelSpectrogramPreprocessor from the .nemo's
model_config.yaml (80 log-mel, 25 ms Hann window periodic=False, 10 ms hop, n_fft 512, preemph
0.97, power spectrum, slaney mel fb, log(x + 2^-24), per-feature mean/std over time; dither
off at inference). Tokens: the pa sentencepiece BPE (256 pieces, ids match tokens.txt), blank 256.
Encoder subsampling 4 -> 40 ms frames."""
import re, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import numpy as np
import torch, torchaudio
import onnxruntime as ort
import sentencepiece as spm
import bake_common as C

from paths import MODELS   # package copy: models fetched by fetch_assets.py
ONNX = MODELS / "onnx-pa-only/fp32/indicconformer-pa-ctc.onnx"
SPM = MODELS / "tokenizer.model"   # langs.pa.model_path in model_config.yaml


class NemoFeats:
    def __init__(self, preemph=0.97, periodic=False, center=True, mag_power=2.0, normalize=True, mel_norm="slaney", guard=2 ** -24):
        self.preemph, self.periodic, self.center, self.mag_power, self.normalize, self.guard = preemph, periodic, center, mag_power, normalize, guard
        self.win = torch.hann_window(400, periodic=periodic)
        self.fb = torchaudio.functional.melscale_fbanks(257, 0.0, 8000.0, 80, 16000, norm=mel_norm, mel_scale="slaney")  # (257, 80)

    def __call__(self, wave):
        x = torch.from_numpy(wave)
        if self.preemph:
            x = torch.cat((x[:1], x[1:] - self.preemph * x[:-1]))
        X = torch.stft(x, n_fft=512, hop_length=160, win_length=400, window=self.win, center=self.center,
                       pad_mode="reflect", return_complex=True)
        mag = X.abs().pow(self.mag_power)                       # (257, T)
        mel = self.fb.T @ mag                                   # (80, T)
        mel = torch.log(mel + self.guard)
        if self.normalize:
            mel = (mel - mel.mean(dim=1, keepdim=True)) / (mel.std(dim=1, keepdim=True) + 1e-5)
        return mel[None].numpy().astype(np.float32)            # (1, 80, T)


class IndicConformer:
    name = "indicconformer"
    blank = 256
    delim = None

    def __init__(self, threads=4):
        self.sp = spm.SentencePieceProcessor(model_file=str(SPM))
        self.feats = NemoFeats()
        self.load_s = None
        self.set_threads(threads)

    def set_threads(self, n):
        so = ort.SessionOptions()
        so.intra_op_num_threads = n
        so.inter_op_num_threads = 1
        t = time.perf_counter()
        self.sess = ort.InferenceSession(str(ONNX), so, providers=["CPUExecutionProvider"])
        if self.load_s is None:
            self.load_s = time.perf_counter() - t

    def text_of(self, g, keep_terminal=False):
        return C.conv_gurmukhi(g, keep_terminal)

    def ids_of(self, text):
        ids = self.sp.encode(text)
        assert 0 not in ids, (text, ids)
        return ids

    def decode(self, ids):
        return self.sp.decode(ids)

    def emissions(self, wave):
        f = self.feats(wave)
        out = self.sess.run(["logprobs"], {"audio_signal": f, "length": np.array([f.shape[2]], dtype=np.int64)})[0][0]
        em = torch.from_numpy(out)
        return torch.log_softmax(em, dim=-1)                   # idempotent if already log-softmaxed


cand = IndicConformer()
print(f"load {cand.load_s:.1f}s, blank {cand.blank}, spm pieces {cand.sp.get_piece_size()}")
import onnx
m = onnx.load(str(ONNX), load_external_data=True)
params = sum(int(np.prod(t.dims)) for t in m.graph.initializer)
print(f"onnx initializer params {params / 1e6:.1f}M, file {ONNX.stat().st_size / 1e6:.0f} MB")
del m

# ---- feature validation: greedy-decode line 5 per reciter, CER against japji_lines
ref = C.line_text(5)
print("ref line 5:", ref)
wave, _ = C.block("GGS", 5, 5)
f = cand.feats(wave)
raw = cand.sess.run(["logprobs"], {"audio_signal": f, "length": np.array([f.shape[2]], dtype=np.int64)})[0][0]
print(f"feature frames {f.shape[2]}, output frames {raw.shape[0]} (factor {f.shape[2] / raw.shape[0]:.2f}); "
      f"exp-row-sum of output frame 0 = {np.exp(raw[0]).sum():.3f} (1.0 means already log-softmax)")
cers = {}
for n in C.NAMES:
    wave, _ = C.block(n, 5, 5)
    hyp = cand.decode(C.greedy(cand.emissions(wave), cand.blank))
    cers[n] = C.cer(hyp, ref)
    print(f"greedy line 5 {n}: {hyp}   CER {cers[n]:.1%}")
if max(cers.values()) > 0.25:
    print("CER > 25%: grid over feature knobs")
    best = None
    for periodic in (False, True):
        for center in (True, False):
            for mag_power in (2.0, 1.0):
                for normalize in (True, False):
                    for preemph in (0.97, 0.0):
                        cand.feats = NemoFeats(preemph=preemph, periodic=periodic, center=center, mag_power=mag_power, normalize=normalize)
                        wave, _ = C.block("BJS", 5, 5)
                        hyp = cand.decode(C.greedy(cand.emissions(wave), cand.blank))
                        c = C.cer(hyp, ref)
                        print(f"  periodic={periodic} center={center} mag_power={mag_power} normalize={normalize} preemph={preemph}: CER {c:.1%} {hyp}")
                        if best is None or c < best[0]:
                            best = (c, dict(preemph=preemph, periodic=periodic, center=center, mag_power=mag_power, normalize=normalize))
    print("best", best)
    cand.feats = NemoFeats(**best[1])

C.run_protocol(cand, extra=dict(load_s=cand.load_s, params=params, download_mb=ONNX.stat().st_size / 1e6,
                                licence="Apache-2.0", frame_ms=40, cer_line5=cers, tokens="sentencepiece BPE 256 (near-character)"))
