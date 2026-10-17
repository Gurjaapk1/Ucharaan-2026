# Data locations for the demo server. Default: next to this file; override with UCHAARAN_DATA=/some/dir.
import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = Path(os.environ.get("UCHAARAN_DATA") or HERE)
MODELS = ROOT / "models"     # IndicConformer ONNX + sentencepiece tokenizer (fetch_assets.py)
AUDIO = ROOT / "audio"       # reciter tracks, 16 kHz mono wav (fetch_assets.py, or banis.py on first use)
CLIPS = ROOT / "clips"       # word clips, cut on first request (demo_server.py)
TIMINGS = HERE / "timings"   # per-line timings from the sundar-gutka app (checked in, see build_banis.py)
BANIS = HERE / "banis"       # verse text per bani + track catalog (checked in, see build_banis.py)
