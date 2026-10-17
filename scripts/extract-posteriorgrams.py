"""
Precompute the ustaad's IndicConformer posteriorgrams, one entry per line.

The app compares a child's recitation against these. Running the model over
the 16-minute reference track on a phone every session is not viable, so the
reference side is computed once here and bundled.

  python3 scripts/extract-posteriorgrams.py <model.onnx> <reference.wav>

Output: src/scoring/reference-posteriors-japji.json
"""
import json, sys, wave, array, os
import numpy as np
import onnxruntime as ort

SR, N_FFT, WIN, HOP, N_MELS, PRE, GUARD = 16000, 512, 400, 160, 80, 0.97, 2**-24
BLANK = 256

def hz2mel(f): return 2595 * np.log10(1 + f / 700)
def mel2hz(m): return 700 * (10 ** (m / 2595) - 1)

def mel_filterbank():
    pts = mel2hz(np.linspace(hz2mel(0), hz2mel(SR / 2), N_MELS + 2))
    bins = np.floor((N_FFT + 1) * pts / SR).astype(int)
    fb = np.zeros((N_MELS, N_FFT // 2 + 1), np.float32)
    for i in range(N_MELS):
        l, c, r = bins[i], bins[i + 1], min(bins[i + 2], N_FFT // 2)
        for k in range(l, c): fb[i, k] = (k - l) / max(1, c - l)
        for k in range(c, r): fb[i, k] = (r - k) / max(1, r - c)
    return fb

FB = mel_filterbank()

def log_mel(x):
    """NeMo AudioToMelSpectrogram equivalent, which is what the model expects."""
    x = np.asarray(x, np.float32)
    x = np.concatenate([[x[0]], x[1:] - PRE * x[:-1]])
    win = np.hanning(WIN).astype(np.float32)
    n = 1 + (len(x) - WIN) // HOP
    if n < 1: return np.zeros((N_MELS, 0), np.float32)
    frames = np.stack([x[i * HOP:i * HOP + WIN] * win for i in range(n)])
    spec = np.abs(np.fft.rfft(frames, N_FFT, axis=1)) ** 2
    mel = np.log(FB @ spec.T + GUARD)
    mel = (mel - mel.mean(1, keepdims=True)) / (mel.std(1, keepdims=True) + 1e-5)
    return mel.astype(np.float32)

def posteriorgram(sess, samples):
    """sqrt of the CTC posteriors, blank removed.

    Blank carries no phonetic information and dominates the distribution, so
    including it makes every frame look alike. The square root turns a cosine
    comparison into a Bhattacharyya-style one, which is the right geometry for
    probability vectors.
    """
    f = log_mel(samples)
    if f.shape[1] < 8: return np.zeros((0, BLANK), np.float32)
    lp, _ = sess.run(None, {'processed_signal': f[None],
                            'processed_signal_length': np.array([f.shape[1]], np.int64)})
    p = np.exp(lp[0] - lp[0].max(1, keepdims=True))
    p /= p.sum(1, keepdims=True)
    return np.sqrt(np.delete(p, BLANK, axis=1)).astype(np.float32)

def read_wav(path):
    w = wave.open(path)
    a = array.array('h'); a.frombytes(w.readframes(w.getnframes()))
    return np.array(a, np.float32) / 32768.0, w.getframerate()

def main():
    model, wav = sys.argv[1], sys.argv[2]
    sess = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
    x, sr = read_wav(wav)
    assert sr == SR, f'reference must be {SR} Hz, got {sr}'
    pauris = json.load(open('src/bani.json'))

    lines, frames_total = [], 0
    for pauri in pauris:
        for index, line in enumerate(pauri['lines']):
            seg = x[int(line['start'] * sr):int(line['end'] * sr)]
            g = posteriorgram(sess, seg)
            if len(g) == 0:
                print(f'  pauri {pauri["number"]} line {index}: too short'); continue
            # uint8 is plenty: these are sqrt-probabilities in [0,1].
            packed = np.clip(np.rint(g * 255), 0, 255).astype(np.uint8)
            frames_total += len(g)
            lines.append({'pauri': pauri['number'], 'line': index,
                          'frames': int(g.shape[0]), 'width': int(g.shape[1]),
                          'data': packed.tobytes().hex()})
        print(f'  pauri {pauri["number"]} done', end='\r')

    out = {'bani': 'japji', 'model': os.path.basename(model), 'blankRemoved': True,
           'encoding': 'uint8-sqrt-prob', 'lines': lines}
    path = 'src/scoring/reference-posteriors-japji.json'
    json.dump(out, open(path, 'w'))
    print(f'\nWrote {path}: {len(lines)} lines, {frames_total} frames, '
          f'{os.path.getsize(path)/1024/1024:.1f} MB')

main()
