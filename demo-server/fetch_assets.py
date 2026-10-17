import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
# One-time setup for the demo server (macOS / Linux / Windows):
#   python -m venv .venv && .venv/bin/pip install -r requirements.txt
#   .venv/bin/python fetch_assets.py          # ~1.1 GB download, ~600 MB kept
#   .venv/bin/uvicorn demo_server:app --host 0.0.0.0 --port 8000
# Downloads the IndicConformer ONNX + tokenizer into ./models and the three reciters' Japji Sahib
# recordings into ./audio (decoded to 16 kHz mono wav). Re-running skips anything already present.
import shutil, subprocess, tarfile, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import imageio_ffmpeg
from huggingface_hub import hf_hub_download
from paths import AUDIO, MODELS

REPO = "surindersinghssj/indicconformer-pa-v3-kirtan"
ONNX = "onnx-pa-only/fp32/indicconformer-pa-ctc.onnx"
NEMO = "indicconformer-pa-v3-kirtan.nemo"
TOKENIZER_MEMBER = "./0940175879b84382b38eed39f1e6f473_tokenizer.model"   # langs.pa.model_path in the .nemo's model_config.yaml
CDN = "https://gurbani-audios-c4abhzghhnccd5gj.z01.azurefd.net/audios/{}/JapjiSahib.m4a"
RECITERS = {"GianiGurdevSingh": "japji_ggs", "BhaiJarnailSingh": "japji_BhaiJarnailSingh",
            "IndermohanKaurUK": "japji_IndermohanKaurUK"}


def fetch_model():
    MODELS.mkdir(parents=True, exist_ok=True)
    if not (MODELS / ONNX).exists():
        print(f"downloading {ONNX} (482 MB)")
        hf_hub_download(REPO, ONNX, local_dir=MODELS)
    tok = MODELS / "tokenizer.model"
    if not tok.exists():
        # the pa sentencepiece model only ships inside the .nemo archive (523 MB): pull it out, then drop the archive
        print(f"downloading {NEMO} (523 MB) for its tokenizer")
        nemo = Path(hf_hub_download(REPO, NEMO, local_dir=MODELS))
        with tarfile.open(nemo) as t:
            src = t.extractfile(TOKENIZER_MEMBER)
            tok.write_bytes(src.read())
        nemo.unlink()
    print(f"model ok: {MODELS / ONNX}, {tok}")


def fetch_audio():
    AUDIO.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    for folder, stem in RECITERS.items():
        wav, m4a = AUDIO / f"{stem}.wav", AUDIO / f"{stem}.m4a"
        if wav.exists():
            continue
        if not m4a.exists():
            print(f"downloading {folder} Japji Sahib")
            req = urllib.request.Request(CDN.format(folder), headers={"User-Agent": "uchaaran-demo"})
            with urllib.request.urlopen(req) as r, open(m4a, "wb") as f:
                shutil.copyfileobj(r, f)
        # same decode as spike-align/reciter_check.py: mono, 16 kHz, 16-bit wav
        subprocess.run([ffmpeg, "-loglevel", "error", "-y", "-i", str(m4a), "-ac", "1", "-ar", "16000", str(wav)], check=True)
        print(f"wrote {wav}")


if __name__ == "__main__":
    fetch_model()
    fetch_audio()
    print("assets ready; start with: uvicorn demo_server:app --host 0.0.0.0 --port 8000")
