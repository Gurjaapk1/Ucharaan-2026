# Reference store for every bani the scorer can score: verse text by Seq (banis/<id>.json), the reciter tracks the
# Sundar Gutka app streams and their line timings (banis/catalog.json, timings/), decoded once to 16 kHz mono wav.
import json, os, shutil, subprocess, threading, urllib.request

import soundfile as sf

from paths import AUDIO, BANIS, TIMINGS

CDN = "https://gurbani-audios-c4abhzghhnccd5gj.z01.azurefd.net/audios"
SR = 16000
PAD = 0.3                                  # seconds either side of a block, as bake_common.block
ORDER = ["ggs", "bjs", "imk"]              # reciter order the manifest has always used
CATALOG = {b["id"]: b for b in json.load(open(BANIS / "catalog.json", encoding="utf-8"))}
VERSE_MARKS = "\u0964\u0965" + "".join(chr(c) for c in range(0x0A66, 0x0A70))   # danda, double danda, digits 0-9
_text, _timings, _locks = {}, {}, {}
_guard = threading.Lock()


def reciters(bani):
    return [r for r in ORDER if r in CATALOG[bani]["reciters"]]


def lines(bani):
    if bani not in _text:
        _text[bani] = {s: g for s, g in json.load(open(BANIS / f"{bani}.json", encoding="utf-8"))["lines"]}
    return _text[bani]


def words_of(bani, seq):
    """Words as recited: verse-end marks and numerals dropped, also when glued to a word (Jaap has one)."""
    return [w for w in (x.strip(VERSE_MARKS) for x in lines(bani)[seq].split()) if w]


def timings(bani, rec):
    """{seq: (start, end)} in the reciter's track; seqs the reciter does not recite are absent."""
    if (bani, rec) not in _timings:
        rows = json.load(open(TIMINGS / CATALOG[bani]["reciters"][rec]["timings"], encoding="utf-8"))
        _timings[bani, rec] = {int(str(r["text"]).strip()): (float(r["start"]), float(r["end"])) for r in rows}
    return _timings[bani, rec]


def covered(bani, rec, s0, s1):
    t = timings(bani, rec)
    return [s for s in range(s0, s1 + 1) if s in t]


def wav_path(bani, rec):
    """The reciter's track as 16 kHz mono wav; downloaded and decoded on first use if the build did not fetch it."""
    meta = CATALOG[bani]["reciters"][rec]
    wav = AUDIO / f"{meta['audio']}.wav"
    if wav.exists():
        return wav
    with _guard:
        lock = _locks.setdefault((bani, rec), threading.Lock())
    with lock:
        if not wav.exists():
            fetch_track(meta)
    return wav


def fetch_track(meta):
    import imageio_ffmpeg
    AUDIO.mkdir(parents=True, exist_ok=True)
    wav, m4a = AUDIO / f"{meta['audio']}.wav", AUDIO / f"{meta['audio']}.m4a"
    if not m4a.exists():
        req = urllib.request.Request(f"{CDN}/{meta['track']}", headers={"User-Agent": "UchaaranAssetFetcher/1.0"})
        part = m4a.with_suffix(f".m4a.{os.getpid()}.part")   # per process: fetch_assets and a server may overlap
        with urllib.request.urlopen(req, timeout=120) as r, open(part, "wb") as f:
            shutil.copyfileobj(r, f)
            size = int(r.headers.get("Content-Length") or 0)
        got = part.stat().st_size
        if size and got != size:                      # a dropped connection ends the copy without an error
            part.unlink()
            raise IOError(f"{meta['track']}: received {got} of {size} bytes")
        part.replace(m4a)
    # same decode as spike-align/reciter_check.py: mono, 16 kHz, 16-bit wav
    part = wav.with_suffix(f".wav.{os.getpid()}.part")
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-y", "-i", str(m4a), "-ac", "1",
                    "-ar", str(SR), "-f", "wav", str(part)], check=True)
    last = max(float(r["end"]) for r in json.load(open(TIMINGS / meta["timings"], encoding="utf-8")))
    secs = sf.info(str(part)).duration
    if secs < last - 1.0:                             # ffmpeg decodes a truncated file without failing
        part.unlink()
        m4a.unlink()
        raise IOError(f"{meta['track']}: decoded {secs:.0f} s, its timings run to {last:.0f} s")
    part.replace(wav)
    m4a.unlink()
    return wav


def block(bani, rec, s0, s1):
    """Reciter audio of lines s0..s1 with PAD seconds either side; returns (wave, t0). Reads only that span."""
    t = timings(bani, rec)
    spans = [t[s] for s in covered(bani, rec, s0, s1)]
    t0 = max(0.0, min(min(a, b) for a, b in spans) - PAD)   # some tracks start a line at 0; one Jaap row has end < start
    t1 = max(max(a, b) for a, b in spans) + PAD
    a = int(t0 * SR)
    with sf.SoundFile(wav_path(bani, rec)) as f:
        f.seek(a)
        wave = f.read(int(t1 * SR) - a, dtype="float32")
    return wave, t0
