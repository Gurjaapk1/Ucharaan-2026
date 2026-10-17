import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
# Demo scoring API wrapping phone_score.py (2026-10-16 live demo). Flags are the spike's UNCALIBRATED heuristics.
# setup: pip install -r requirements.txt; python fetch_assets.py
# run:   uvicorn demo_server:app --host 0.0.0.0 --port 8000   (from this folder)
import ast, json, logging, os, tempfile, threading, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware


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

API_KEY = os.environ.get("UCHAARAN_API_KEY", "uchaaran-demo")
RECITERS = ["ggs", "bjs", "imk"]
from paths import MODELS, AUDIO
if not (MODELS / "tokenizer.model").exists() or not (AUDIO / "japji_ggs.wav").exists():
    sys.exit("models/ or audio/ missing: run `python fetch_assets.py` first")
CAND, _SHOW = P["get_model"]("indicconformer")      # loaded once at startup
LOCK = threading.Lock()
# reference results: read phone_score's cache file, never write it (new keys live in memory only)
REFCACHE = json.load(open(P["CACHE"], encoding="utf-8")) if P["CACHE"].exists() else {}
log.info(f"model {CAND.name} loaded; refcache keys {list(REFCACHE)}")

app = FastAPI(title="uchaaran demo scorer")
# browser clients: allow any origin; X-Api-Key must be listed or the preflight fails
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST", "OPTIONS"],
                   allow_headers=["X-Api-Key", "Content-Type"])


def parse_seqs(s):
    s = s.strip()
    if "-" in s:
        a, b = (int(x) for x in s.split("-", 1))
        seqs = list(range(a, b + 1))
    else:
        seqs = sorted({int(x) for x in s.split(",") if x.strip()})
    if not seqs or any(q not in C.LINES for q in seqs):
        raise ValueError(f"seqs must be within {min(C.LINES)}-{max(C.LINES)}")
    return seqs


def reference(ref, s0, s1):
    key = f"{CAND.name}:{ref}:{s0}-{s1}"
    if key not in REFCACHE:
        rwave, _ = C.block(ref, s0, s1)
        em, ratio = P["emissions"](CAND, rwave)
        ids = [CAND.ids_of(CAND.text_of(w)) for s in range(s0, s1 + 1) for w in C.gurmukhi_of(s)]
        REFCACHE[key] = dict(block_s=len(rwave) / SR, words=P["as_secs"](C.align(em, ids, CAND.blank, CAND.delim)[0], ratio))
    return REFCACHE[key]


def score_rows(path, ref, s0, s1):
    """phone_score.main()'s scoring loop, minus printing and file writes. Returns (rows, silent)."""
    words = [(s, i, w) for s in range(s0, s1 + 1) for i, w in enumerate(C.gurmukhi_of(s))]
    wave = P["decode"](path)
    dur = len(wave) / SR
    peak, rms = (float(np.abs(wave).max()), float(np.sqrt(np.mean(wave ** 2)))) if len(wave) else (0.0, 0.0)
    if peak < 0.005 or rms < 1e-3:
        return [dict(seq=s, idx=i, gurmukhi=w, flag="unclear", gop=None, ref_gop=None) for s, i, w in words], True
    ids = [CAND.ids_of(CAND.text_of(w)) for _, _, w in words]
    with LOCK:
        R = reference(ref, s0, s1)
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


@app.get("/v1/manifest")
def manifest(bani: int = 2):
    return {"bani": bani, "reciters": RECITERS, "star_bands": [60, 80, 95], "lines": {}}


@app.post("/v1/score")
async def score(audio: UploadFile = File(...), bani: str = Form("2"), reciter: str = Form("ggs"),
                seqs: str = Form("5-10"), x_api_key: str = Header(None)):
    t0 = time.time()
    if x_api_key != API_KEY:
        raise HTTPException(401, "bad or missing X-Api-Key")
    if reciter.lower() not in RECITERS:
        raise HTTPException(400, f"reciter must be one of {RECITERS}")
    try:
        keep = parse_seqs(seqs)
    except ValueError as e:
        raise HTTPException(400, str(e))
    data = await audio.read()
    suffix = Path(audio.filename or "a.wav").suffix or ".wav"
    fd, tmp = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        rows, silent = score_rows(tmp, reciter.upper(), min(keep), max(keep))
    except Exception as e:
        log.info(f"score FAILED in {time.time() - t0:.2f}s: {type(e).__name__}: {e}")
        raise HTTPException(422, f"could not score recording: {type(e).__name__}")
    finally:
        try:
            os.unlink(tmp)
        except OSError:
            pass
    body, n = to_response(rows, silent, set(keep))
    log.info(f"score bani={bani} ref={reciter} seqs={seqs} {time.time() - t0:.2f}s words={n} status={body['status']}")
    return body
