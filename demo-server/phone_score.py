import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
# Throwaway scorer: one phone recording of Japji Sahib lines vs a reference reciter.
# usage: python -I phone_score.py <audio> --seqs 5-10 --model indicconformer|mms_fa --ref ggs|bjs|imk
import argparse, ast, json, subprocess
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
import numpy as np
import imageio_ffmpeg
import bake_common as C

sys.stdout.reconfigure(encoding="utf-8", errors="replace")   # bake_common resets errors to strict
SR = C.SR
CACHE = HERE / "phone_score_refcache.json"
NOTE = ("NOTE: flags are UNCALIBRATED heuristics from the 2026-10-16 spike "
        "(miss? = conf < 0.35 x ref, check = ref GOP - GOP > 1.5, unclear = conf < 0.15), not the product's scoring.")


def load_classes(fname):
    # bake_*.py run the whole bake-off at import; exec only what precedes `cand = ...`
    tree = ast.parse((HERE / fname).read_text(encoding="utf-8"))
    body = []
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, "id", None) == "cand" for t in node.targets):
            break
        body.append(node)
    ns = {"__name__": fname[:-3], "__file__": str(HERE / fname)}
    exec(compile(ast.Module(body, type_ignores=[]), fname, "exec"), ns)
    return ns


def get_model(name):
    if name == "indicconformer":
        ns = load_classes("bake_indicconformer.py")
        if ns["ONNX"].exists() and ns["SPM"].exists():
            cand = ns["IndicConformer"]()
            return cand, lambda t: "·".join(p.lstrip("▁") for p in cand.sp.encode(t, out_type=str))
        print("IndicConformer ONNX/tokenizer not cached; falling back to mms_fa")
    ns = load_classes("bake_mms_fa.py")
    return ns["MMSFA"](), lambda t: t


def decode(path):
    # one ffmpeg path covers m4a/mp3/wav, stereo, 44.1/48 kHz
    out = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True)
    return np.frombuffer(out.stdout, np.float32).copy()


def emissions(cand, wave):
    em = cand.emissions(wave)
    return em, len(wave) / em.shape[0] / SR


def as_secs(words, ratio):
    return [dict(start_s=w["start"] * ratio, end_s=w["end"] * ratio, conf=w["conf"], gop=w["gop"]) for w in words]


def flag(c, r):
    if c is None:
        return "unclear"
    if c["conf"] < 0.35 * r["conf"]:
        return "miss?"
    if r["gop"] - c["gop"] > 1.5:
        return "check"
    if c["conf"] < 0.15:
        return "unclear"
    return "ok"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--seqs", default="5-10")
    ap.add_argument("--model", default="indicconformer", choices=["indicconformer", "mms_fa"])
    ap.add_argument("--ref", default="ggs", choices=["ggs", "bjs", "imk"])
    a = ap.parse_args()
    s0, s1 = (int(x) for x in a.seqs.split("-")) if "-" in a.seqs else (int(a.seqs),) * 2
    ref = a.ref.upper()
    audio = Path(a.audio)
    out_path = audio.parent / f"{audio.stem}.scores.json"
    words = [(s, i, w) for s in range(s0, s1 + 1) for i, w in enumerate(C.gurmukhi_of(s))]

    wave = decode(audio)
    dur = len(wave) / SR
    peak, rms = (float(np.abs(wave).max()), float(np.sqrt(np.mean(wave ** 2)))) if len(wave) else (0.0, 0.0)
    print(f"{audio.name}: {dur:.1f}s after decode to 16 kHz mono, peak {peak:.3f}, rms {rms:.4f}")
    if peak < 0.005 or rms < 1e-3:
        print("Recording is silent (or nearly): nothing to score. All words marked unclear.")
        rows = [dict(key=f"{s}.{i}", gurmukhi=w, flag="unclear", note="silent recording") for s, i, w in words]
        json.dump(dict(audio=str(audio), silent=True, rows=rows, note=NOTE), open(out_path, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        print(f"wrote {out_path}")
        return

    cand, show = get_model(a.model)
    texts = [cand.text_of(w) for _, _, w in words]
    ids = [cand.ids_of(t) for t in texts]

    cache = json.load(open(CACHE, encoding="utf-8")) if CACHE.exists() else {}
    key = f"{cand.name}:{ref}:{s0}-{s1}"
    if key not in cache:
        rwave, _ = C.block(ref, s0, s1)
        em, ratio = emissions(cand, rwave)
        cache[key] = dict(block_s=len(rwave) / SR, words=as_secs(C.align(em, ids, cand.blank, cand.delim)[0], ratio))
        json.dump(cache, open(CACHE, "w", encoding="utf-8"), indent=1)
    R = cache[key]

    em, ratio = emissions(cand, wave)
    child, n_fit, why = None, len(words), None
    try:
        if dur < 0.6 * R["block_s"]:
            raise C.AlignError(f"{dur:.1f}s vs reference {R['block_s']:.1f}s")
        child = as_secs(C.align(em, ids, cand.blank, cand.delim)[0], ratio)
    except C.AlignError as e:
        # recording too short for the text: keep the word prefix with the best CTC path score
        why = str(e)
        best = None
        for n in range(1, len(words) + 1):
            try:
                w, lp = C.align(em, ids[:n], cand.blank, cand.delim)
            except C.AlignError:
                break
            if best is None or lp > best[0]:
                best = (lp, n, w)
        n_fit = best[1] if best else 0
        child = as_secs(best[2], ratio) if best else []
        if n_fit < len(words):
            print(f"Recording shorter than the text ({why}): it covers about {n_fit} of {len(words)} words; the rest "
                  f"are marked unclear (the < 0.6 x reference trigger and the prefix choice are heuristics too).")
        else:
            why = None

    rows = []
    for j, (s, i, w) in enumerate(words):
        c = child[j] if j < n_fit else None
        r = R["words"][j]
        rows.append(dict(key=f"{s}.{i}", seq=s, gurmukhi=w, text=show(texts[j]),
                         conf=c and c["conf"], gop=c and c["gop"], dur=c and c["end_s"] - c["start_s"],
                         start_s=c and c["start_s"], ref_conf=r["conf"], ref_gop=r["gop"],
                         ref_dur=r["end_s"] - r["start_s"], flag=flag(c, r), note=None if c else "not reached"))

    f = lambda v, fmt: "-" if v is None else format(v, fmt)
    print(f"\nmodel {cand.name}, reference {ref}, seqs {s0}-{s1}")
    print(f"{'seq.i':<6}{'gurmukhi':<11}{'tokens':<18}{'conf':>6}{'GOP':>7}{'refconf':>8}{'refGOP':>7}{'dur':>6}{'refdur':>7}  flag")
    for r in rows:
        print(f"{r['key']:<6}{r['gurmukhi']:<11}{r['text']:<18}{f(r['conf'], '.2f'):>6}{f(r['gop'], '+.2f'):>7}"
              f"{r['ref_conf']:>8.2f}{r['ref_gop']:>+7.2f}{f(r['dur'], '.2f'):>6}{r['ref_dur']:>7.2f}  {r['flag']}")
    lines = {}
    print()
    for s in range(s0, s1 + 1):
        fl = [r["flag"] for r in rows if r["seq"] == s]
        lines[s] = sum(x == "ok" for x in fl) / len(fl)
        print(f"line {s}: {sum(x == 'ok' for x in fl)}/{len(fl)} ok ({lines[s]:.0%})  " + C.line_text(s))
    print("\n" + NOTE)
    json.dump(dict(audio=str(audio), model=cand.name, ref=ref, seqs=[s0, s1], dur_s=dur, ref_block_s=R["block_s"],
                   words_reached=n_fit, truncated_because=why, line_ok_share=lines, rows=rows, note=NOTE),
              open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"wrote {out_path}")


main()
