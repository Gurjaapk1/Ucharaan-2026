import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
# Demo scoring API wrapping phone_score.py (2026-10-16 live demo). Flags are the spike's UNCALIBRATED heuristics.
# Scores any bani in banis/catalog.json against one reciter's track, and serves word clips of the reciter.
# setup: pip install -r requirements.txt; python fetch_assets.py
# run:   uvicorn demo_server:app --host 0.0.0.0 --port 8000   (from this folder)
import ast, gzip, json, logging, os, re, tempfile, threading, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from fastapi import FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response


def load_phone_score():
    # phone_score.py ends with a bare main() call; exec everything before it so its internals load untouched
    src = HERE / "phone_score.py"
    tree = ast.parse(src.read_text(encoding="utf-8"))
    body = [n for n in tree.body
            if not (isinstance(n, ast.Expr) and isinstance(n.value, ast.Call) and getattr(n.value.func, "id", None) == "main")]
    ns = {"__name__": "phone_score", "__file__": str(src)}
    exec(compile(ast.Module(body, type_ignores=[]), str(src), "exec"), ns)
    return ns


P = load_phone_score()
C, np, SR = P["C"], P["np"], P["SR"]
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s", stream=sys.stdout, force=True)
log = logging.getLogger("demo_server")

API_KEY = os.environ.get("UCHAARAN_API_KEY")
if not API_KEY or API_KEY == "REPLACE_WITH_SECRET":
    raise RuntimeError("Set UCHAARAN_API_KEY to a private deployment secret before starting the scorer")
import banis as B
from paths import CLIPS, MODELS
if not (MODELS / "tokenizer.model").exists():
    sys.exit("models/ missing: run `python fetch_assets.py` first")
CAND, _SHOW = P["get_model"]("indicconformer")      # loaded once at startup
torch = C.torch
torch.set_num_threads(4)                              # ORT already runs 4 intra-op threads (IndicConformer.set_threads)
MAX_SPAN = 30            # lines per request; the reference is one block of reciter audio, so 1-385 would be 21 min
FOLLOW_MIN_S = 1.0       # /v1/follow: shorter clips are treated as not started yet
CLIP_PAD = 0.06          # seconds of the reciter's audio kept either side of a word clip
CLIP_MAX = 3.0           # a sung word can run on; this keeps every clip under 100 KB
LOCK = threading.Lock()  # one model, one inference at a time
CLIP_LOCK = threading.Lock()
# reference results: read phone_score's cache file, never write it (new keys live in memory only)
REFCACHE = json.load(open(P["CACHE"], encoding="utf-8")) if P["CACHE"].exists() else {}
log.info(f"model {CAND.name} loaded; refcache keys {list(REFCACHE)}")

app = FastAPI(title="uchaaran demo scorer")
# browser clients: allow any origin; X-Api-Key must be listed or the preflight fails
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST", "OPTIONS"],
                   allow_headers=["X-Api-Key", "Content-Type"])


def parse_request(bani, reciter, seqs):
    """Form fields -> (bani id, reciter, seqs). ValueError (-> 400) names what is available instead."""
    try:
        b = int(str(bani).strip())
    except ValueError:
        b = None
    if b not in B.CATALOG:
        raise ValueError(f"bani must be one of {sorted(B.CATALOG)}")
    rec = str(reciter).lower()
    if rec not in B.reciters(b):
        raise ValueError(f"reciter must be one of {B.reciters(b)}")
    return b, rec, parse_seqs(seqs, b, rec)


def parse_seqs(s, bani, rec):
    """'5-10' (the reciter's lines in that range) or '5,7'. A line the reciter does not recite cannot be scored."""
    have = B.timings(bani, rec)
    lo, hi = min(have), max(have)
    s = s.strip()
    if "-" in s:
        a, z = (int(x) for x in s.split("-", 1))
        seqs = B.covered(bani, rec, a, z) if a in have and z in have else [a, z]
    else:
        seqs = sorted({int(x) for x in s.split(",") if x.strip()})
    if not seqs or any(q < lo or q > hi for q in seqs):
        raise ValueError(f"seqs must be within {lo}-{hi}")
    missing = [q for q in seqs if q not in have]
    if missing:
        raise ValueError(f"lines {missing} are not in the {rec} recording of bani {bani}")
    if seqs[-1] - seqs[0] + 1 > MAX_SPAN:
        raise ValueError(f"seqs may span at most {MAX_SPAN} lines")
    return seqs


def block_words(bani, rec, s0, s1):
    return [(s, i, w) for s in B.covered(bani, rec, s0, s1) for i, w in enumerate(B.words_of(bani, s))]


def reference(bani, rec, s0, s1):
    """The reciter's own alignment of lines s0..s1 (call under LOCK). Japji keeps phone_score's cache keys, so the
    shipped phone_score_refcache.json still applies."""
    ref = rec.upper()
    key = f"{CAND.name}:{ref}:{s0}-{s1}" if bani == 2 else f"{CAND.name}:{bani}:{ref}:{s0}-{s1}"
    if key not in REFCACHE:
        rwave, _ = B.block(bani, rec, s0, s1)
        em, ratio = P["emissions"](CAND, rwave)
        ids = [CAND.ids_of(CAND.text_of(w)) for _, _, w in block_words(bani, rec, s0, s1)]
        REFCACHE[key] = dict(block_s=len(rwave) / SR, words=P["as_secs"](C.align(em, ids, CAND.blank, CAND.delim)[0], ratio))
    return REFCACHE[key]


def score_rows(path, bani, rec, keep):
    """phone_score.main()'s scoring loop, minus printing and file writes. Returns (rows, silent)."""
    s0, s1 = min(keep), max(keep)
    words = block_words(bani, rec, s0, s1)
    B.wav_path(bani, rec)                 # a track the build did not fetch downloads here, outside the model lock
    wave = P["decode"](path)
    dur = len(wave) / SR
    peak, rms = (float(np.abs(wave).max()), float(np.sqrt(np.mean(wave ** 2)))) if len(wave) else (0.0, 0.0)
    if peak < 0.005 or rms < 1e-3:
        return [dict(seq=s, idx=i, gurmukhi=w, flag="unclear", gop=None, ref_gop=None) for s, i, w in words], True
    ids = [CAND.ids_of(CAND.text_of(w)) for _, _, w in words]
    with LOCK:
        R = reference(bani, rec, s0, s1)
        em, ratio = P["emissions"](CAND, wave)
    n_fit = len(words)
    try:
        if dur < 0.6 * R["block_s"]:
            raise C.AlignError("short")
        child = P["as_secs"](C.align(em, ids, CAND.blank, CAND.delim)[0], ratio)
    except C.AlignError:
        best = None
        for n in range(1, len(words) + 1):
            try:
                w, lp = C.align(em, ids[:n], CAND.blank, CAND.delim)
            except C.AlignError:
                break
            if best is None or lp > best[0]:
                best = (lp, n, w)
        n_fit = best[1] if best else 0
        child = P["as_secs"](best[2], ratio) if best else []
    rows = []
    for j, (s, i, w) in enumerate(words):
        c = child[j] if j < n_fit else None
        r = R["words"][j]
        rows.append(dict(seq=s, idx=i, gurmukhi=w, flag=P["flag"](c, r), gop=c and c["gop"], ref_gop=r["gop"]))
    return rows, False


STATE = {"ok": ("like", []), "check": ("check", ["gop"]), "miss?": ("check", ["miss"]), "unclear": ("unclear", [])}


def to_response(rows, silent, keep):
    lines, focus, best_gap, n_unclear = [], None, None, 0
    for s in sorted({r["seq"] for r in rows}):
        if s not in keep:
            continue
        out = []
        for r in (x for x in rows if x["seq"] == s):
            state, reasons = STATE[r["flag"]]
            n_unclear += state == "unclear"
            out.append(dict(idx=r["idx"], gurmukhi=r["gurmukhi"], state=state, reasons=list(reasons)))
            if state == "check" and r["gop"] is not None:
                gap = r["ref_gop"] - r["gop"]
                if best_gap is None or gap > best_gap:
                    best_gap, focus = gap, dict(seq=s, idx=r["idx"])
        clear = [w for w in out if w["state"] != "unclear"]
        share = sum(w["state"] == "like" for w in clear) / len(clear) if clear else 0.0
        lines.append(dict(seq=s, share_like=round(share, 3), words=out))
    n = sum(len(l["words"]) for l in lines)
    status = "unclear" if silent or n_unclear * 2 > n else "ok"
    return dict(status=status, lines=lines, focus=focus), n


@app.get("/healthz")
def healthz():
    return {"ok": True, "model": CAND.name}


MANIFESTS = {}


@app.get("/v1/manifest")
def manifest(request: Request, bani: int = 2):
    """Banis and reciters the service scores, star bands, and for this bani every line each reciter recites with
    its words and their clip paths (resolved by the app as {base}/reference/{clip_url})."""
    if bani not in B.CATALOG:
        raise HTTPException(404, f"bani must be one of {sorted(B.CATALOG)}")
    if bani not in MANIFESTS:
        body = dict(bani=bani, reciters=B.reciters(bani), star_bands=[60, 80, 95],
                    banis=[dict(id=k, token=v["token"], name=v["name"], reciters=B.reciters(k))
                           for k, v in B.CATALOG.items()],
                    lines={rec: {str(s): dict(words=[dict(idx=i, gurmukhi=w, clip_url=f"{bani}/{rec}/{s}/{i}.wav")
                                                     for i, w in enumerate(B.words_of(bani, s))])
                                 for s in sorted(B.timings(bani, rec))}
                           for rec in B.reciters(bani)})
        raw = json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        MANIFESTS[bani] = (raw, gzip.compress(raw, 6))
    raw, packed = MANIFESTS[bani]
    if "gzip" in request.headers.get("accept-encoding", ""):
        return Response(packed, media_type="application/json",
                        headers={"Content-Encoding": "gzip", "Vary": "Accept-Encoding"})
    return Response(raw, media_type="application/json", headers={"Vary": "Accept-Encoding"})


# ---- word clips: the reciter saying one word, cut at the aligned word boundaries ----

CLIP_PATH = re.compile(r"(\d+)/([a-z]+)/(\d+)/(\d+)\.wav")


def clip_spans(wave, words):
    """Sample span of each aligned word. CTC puts a word's tokens on a few 40 ms frames, so each edge moves out to
    where the voice stops: the first quiet 10 ms frame after the word and the last one before the next word (the
    quietest frame between them when there is no pause), then CLIP_PAD more on both sides."""
    hop = SR // 100
    n = len(wave) // hop
    db = 10 * np.log10(np.mean(wave[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-10)
    quiet = db < max(db.max() - 30, -50)
    frame = lambda t: min(n, max(0, int(round(t * 100))))
    starts, ends = [frame(w["start_s"]) for w in words], [frame(w["end_s"]) for w in words]
    lo, hi = [0] * len(words), [0] * len(words)
    for i in range(len(words) + 1):            # gap i lies between word i-1 and word i
        a = ends[i - 1] if i else max(0, starts[0] - 50)
        z = starts[i] if i < len(words) else min(n, ends[-1] + 80)
        q = np.flatnonzero(quiet[a:z]) if z > a else []
        if len(q):
            stop, go = a + q[0], a + q[-1] + 1
        else:
            stop = go = a + int(np.argmin(db[a:z])) if z > a else a
        if i:
            hi[i - 1] = stop
        if i < len(words):
            lo[i] = go
    pad = int(CLIP_PAD * SR)
    return [(max(0, a * hop - pad), min(len(wave), min(max(z, a + 4), a + int(CLIP_MAX * 100)) * hop + pad))
            for a, z in zip(lo, hi)]


def line_clips(bani, rec, seq):
    """Folder with {idx}.wav for every word of one line; the first request for a line cuts all of them."""
    d = CLIPS / str(bani) / rec / str(seq)
    if d.is_dir():
        return d
    with CLIP_LOCK:
        if d.is_dir():
            return d
        wave, _ = B.block(bani, rec, seq, seq)
        n = len(B.words_of(bani, seq))
        try:
            with LOCK:
                words = reference(bani, rec, seq, seq)["words"]
            spans = clip_spans(wave, words)
        except C.AlignError:                   # line timing too short for its text: each word gets the whole line
            spans = [(0, min(len(wave), int(CLIP_MAX * SR)))] * n
        tmp = d.with_name(d.name + ".part")
        tmp.mkdir(parents=True, exist_ok=True)
        fade = np.linspace(0, 1, SR // 200, dtype=np.float32)
        for i, (a, z) in enumerate(spans):
            x = wave[a:z].copy()
            k = min(len(fade), len(x) // 2)
            if k:
                x[:k] *= fade[:k]
                x[-k:] *= fade[:k][::-1]
            B.sf.write(tmp / f"{i}.wav", x, SR, subtype="PCM_16")
        os.replace(tmp, d)
    return d


@app.get("/reference/{path:path}")
def reference_clip(path: str):
    """A manifest clip_url. No key: the app's audio player cannot send one, and the clips come from the reciter
    tracks the Khalis CDN already serves publicly."""
    m = CLIP_PATH.fullmatch(path)
    if not m:
        raise HTTPException(404, "no such clip")
    bani, rec, seq, idx = int(m[1]), m[2], int(m[3]), int(m[4])
    if (bani not in B.CATALOG or rec not in B.reciters(bani) or seq not in B.timings(bani, rec)
            or idx >= len(B.words_of(bani, seq))):
        raise HTTPException(404, "no such clip")
    return FileResponse(line_clips(bani, rec, seq) / f"{idx}.wav", media_type="audio/wav",
                        headers={"Cache-Control": "public, max-age=86400"})


@app.post("/v1/score")
async def score(audio: UploadFile = File(...), bani: str = Form("2"), reciter: str = Form("ggs"),
                seqs: str = Form("5-10"), x_api_key: str = Header(None)):
    t0 = time.time()
    if x_api_key != API_KEY:
        raise HTTPException(401, "bad or missing X-Api-Key")
    try:
        b, rec, keep = parse_request(bani, reciter, seqs)
    except ValueError as e:
        raise HTTPException(400, str(e))
    data = await audio.read()
    suffix = Path(audio.filename or "a.wav").suffix or ".wav"
    fd, tmp = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        rows, silent = score_rows(tmp, b, rec, keep)
    except Exception as e:
        log.info(f"score FAILED in {time.time() - t0:.2f}s: {type(e).__name__}: {e}")
        raise HTTPException(422, f"could not score recording: {type(e).__name__}")
    finally:
        try:
            os.unlink(tmp)
        except OSError:
            pass
    body, n = to_response(rows, silent, set(keep))
    log.info(f"score bani={b} ref={rec} seqs={seqs} {time.time() - t0:.2f}s words={n} status={body['status']}")
    return body



# ---- /v1/follow: where in the text is the reader, given the recording so far ----

def best_prefix(em, ids):
    """phone_score's short-recording rule (keep the word prefix whose forced alignment has the best CTC path
    log-prob), always applied: a partial recording can be long enough for a full alignment, which would mark
    every word reached. Only the path score is computed per prefix; word stats come from one C.align after."""
    T, em_b = em.shape[0], em[None].contiguous()
    tokens, repeats, best = [], 0, None
    for n, wid in enumerate(ids, 1):
        new = ([CAND.delim] if CAND.delim is not None and n > 1 else []) + list(wid)
        for t in new:
            repeats += bool(tokens) and tokens[-1] == t
            tokens.append(t)
        if T < len(tokens) + repeats:
            break
        _, scores = C.F.forced_align(em_b, torch.tensor([tokens], dtype=torch.int32), blank=CAND.blank)
        lp = float(scores[0].sum())
        if best is None or lp > best[0]:
            best = (lp, n)
    if best is None:
        return 0, []
    try:
        return best[1], C.align(em, ids[:best[1]], CAND.blank, CAND.delim)[0]
    except C.AlignError:                   # rare span mismatch: fall back to phone_score's own loop
        best = None
        for n in range(1, len(ids) + 1):
            try:
                w, lp = C.align(em, ids[:n], CAND.blank, CAND.delim)
            except C.AlignError:
                break
            if best is None or lp > best[0]:
                best = (lp, n, w)
        return (best[1], best[2]) if best else (0, [])


def follow_body(path, bani, rec, keep):
    s0, s1 = min(keep), max(keep)
    words = block_words(bani, rec, s0, s1)
    B.wav_path(bani, rec)
    t = {"t0": time.time()}
    wave = P["decode"](path)
    t["decode"] = time.time()
    dur = len(wave) / SR
    states, reached, status = ["pending"] * len(words), None, "ok"
    silent = len(wave) == 0 or float(np.abs(wave).max()) < 0.005 or float(np.sqrt(np.mean(wave ** 2))) < 1e-3
    if dur >= FOLLOW_MIN_S and silent:
        status = "unclear"
    elif dur >= FOLLOW_MIN_S:
        ids = [CAND.ids_of(CAND.text_of(w)) for _, _, w in words]
        with LOCK:
            R = reference(bani, rec, s0, s1)
            t["ref"] = time.time()
            em, _ = P["emissions"](CAND, wave)
            t["emis"] = time.time()
        n_fit, child = best_prefix(em, ids)
        t["align"] = time.time()
        for j in range(n_fit):
            states[j] = STATE[P["flag"](child[j], R["words"][j])][0]
        if n_fit:
            reached = dict(seq=words[n_fit - 1][0], idx=words[n_fit - 1][1])
        n_unclear = sum(x == "unclear" for x in states[:n_fit])
        status = "unclear" if n_fit == 0 or n_unclear * 2 > n_fit else "ok"
    lines = []
    for s in sorted(keep):
        lines.append(dict(seq=s, words=[dict(idx=i, gurmukhi=w, state=states[j])
                                        for j, (q, i, w) in enumerate(words) if q == s]))
    marks, prev = [], t["t0"]
    for k in ("decode", "ref", "emis", "align"):
        if k in t:
            marks.append(f"{k} {t[k] - prev:.2f}")
            prev = t[k]
    return dict(status=status, reached=reached, lines=lines), dur, " ".join(marks)


@app.post("/v1/follow")
async def follow(audio: UploadFile = File(...), bani: str = Form("2"), reciter: str = Form("ggs"),
                 seqs: str = Form("5-10"), x_api_key: str = Header(None)):
    t0 = time.time()
    if x_api_key != API_KEY:
        raise HTTPException(401, "bad or missing X-Api-Key")
    try:
        b, rec, keep = parse_request(bani, reciter, seqs)
    except ValueError as e:
        raise HTTPException(400, str(e))
    data = await audio.read()
    suffix = Path(audio.filename or "a.wav").suffix or ".wav"
    fd, tmp = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        body, dur, marks = follow_body(tmp, b, rec, keep)
    except Exception as e:
        log.info(f"follow FAILED in {time.time() - t0:.2f}s: {type(e).__name__}: {e}")
        raise HTTPException(422, f"could not follow recording: {type(e).__name__}")
    finally:
        try:
            os.unlink(tmp)
        except OSError:
            pass
    log.info(f"follow bani={b} ref={rec} seqs={seqs} audio={dur:.1f}s {time.time() - t0:.2f}s [{marks}] "
             f"reached={body['reached']} status={body['status']}")
    return body
