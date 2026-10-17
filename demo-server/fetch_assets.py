import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
# One-time setup for the demo server (macOS / Linux / Windows):
#   python -m venv .venv && .venv/bin/pip install -r requirements.txt
#   .venv/bin/python fetch_assets.py          # ~1.3 GB download, ~1 GB kept
#   .venv/bin/uvicorn demo_server:app --host 0.0.0.0 --port 8000
# Downloads the IndicConformer ONNX + tokenizer into ./models and every reciter track in banis/catalog.json
# (7 banis, 19 tracks, ~270 MB from the Khalis CDN) into ./audio, decoded to 16 kHz mono wav (~450 MB).
# Re-running skips anything already present. `python fetch_assets.py 2 4` fetches only those banis.
import tarfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from huggingface_hub import hf_hub_download
from paths import AUDIO, MODELS
import banis as B

REPO = "surindersinghssj/indicconformer-pa-v3-kirtan"
ONNX = "onnx-pa-only/fp32/indicconformer-pa-ctc.onnx"
NEMO = "indicconformer-pa-v3-kirtan.nemo"
TOKENIZER_MEMBER = "./0940175879b84382b38eed39f1e6f473_tokenizer.model"   # langs.pa.model_path in the .nemo's model_config.yaml


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


def fetch_audio(only=()):
    for bani, meta in B.CATALOG.items():
        if only and bani not in only:
            continue
        for rec in B.reciters(bani):
            wav = AUDIO / f"{meta['reciters'][rec]['audio']}.wav"
            if not wav.exists():
                print(f"fetching {meta['reciters'][rec]['track']}")
                B.fetch_track(meta["reciters"][rec])
            print(f"ok {wav.name}")


if __name__ == "__main__":
    fetch_model()
    fetch_audio({int(x) for x in sys.argv[1:]})
    print("assets ready; start with: uvicorn demo_server:app --host 0.0.0.0 --port 8000")
