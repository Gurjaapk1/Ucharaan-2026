# Data locations for the demo server. Default: next to this file; override with UCHAARAN_DATA=/some/dir.
import os
from pathlib import Path

ROOT = Path(os.environ.get("UCHAARAN_DATA") or Path(__file__).resolve().parent)
MODELS = ROOT / "models"     # IndicConformer ONNX + sentencepiece tokenizer (fetch_assets.py)
AUDIO = ROOT / "audio"       # three reciters' Japji Sahib, 16 kHz mono wav (fetch_assets.py)
TIMINGS = ROOT / "timings"   # per-line timings from the sundar-gutka app (checked in)
