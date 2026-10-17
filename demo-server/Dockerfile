# Demo pronunciation scorer, built in Azure with `az acr build` (no local Docker needed).
# Model + every reciter track in banis/catalog.json (19 tracks, ~450 MB of wav) are fetched at build time,
# so the container starts with no downloads. Word clips are cut on first request into clips/ (ephemeral).
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    OMP_NUM_THREADS=2
WORKDIR /app

COPY requirements.txt .
# CPU-only torch first; pip then accepts 2.5.1+cpu as satisfying torch==2.5.1 in requirements.txt
RUN pip install torch==2.5.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cpu \
 && pip install -r requirements.txt \
 && python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"

COPY . .
# one layer: the .nemo archive, m4a originals and hf metadata are deleted before the layer is committed
RUN python fetch_assets.py \
 && rm -rf /root/.cache audio/*.m4a models/.cache

EXPOSE 8000
CMD ["uvicorn", "demo_server:app", "--host", "0.0.0.0", "--port", "8000"]
