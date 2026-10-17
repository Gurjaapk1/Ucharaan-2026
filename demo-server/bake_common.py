"""Shared harness for the Uchaaran speech-model bake-off (used by every bake_*.py).

A candidate is an object with:
  name          short tag used for output files
  blank         CTC blank id in its emissions
  delim         token id placed between words (w2v-bert "|"), or None
  text_of(g, keep_terminal=False) -> the Gurmukhi word in the model's own text scheme
                 (keep_terminal=True keeps the written terminal sihari/aunkar)
  ids_of(text) -> list of token ids for one word
  emissions(wave float32 @16k) -> torch (T, V) log-probs
  set_threads(n)
  decode(ids) -> str  (for greedy-decode sanity checks)
run_protocol(cand) runs steps A-E of the protocol on Pauri 1 (lines 5-10, one block per
reciter) and writes bake_<name>.json + bake_<name>.txt here and a copy of the json to the run dir.

Conventions fixed here for every model:
  * "correct" text = AS RECITED: terminal sihari/aunkar dropped (anvaad-js rule: kept only
    after a vowel letter such as ਲਾਇ, in -ਹਿ/-ਹੁ verb endings such as ਹੋਹਿ, and in ਜੁ ਸੁ).
    A second pass scores the AS WRITTEN text and reports which form each model prefers.
  * GOP of a word = mean over its tokens of mean over the token's frames of
    logP(token) - max logP(any token)   (identical to reciter_check.py)
  * conf = mean token probability on the forced path (torchaudio TokenSpan.score)
  * separation (pooled) = drop / pooled std of correct-word GOP residuals (47 words x 3
    reciters, each word's own mean removed); separation (per word) = drop / (std of that
    word's GOP across the three reciters + 0.05)
"""
import json, re, sys, time
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
import torchaudio.functional as F

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).parent
from paths import AUDIO, TIMINGS   # package copy: data paths relative to this folder (or $UCHAARAN_DATA)
RUN_DIR = HERE / "runs"
SR = 16000
PAD = 0.3
RECITERS = {
    "GGS": (AUDIO / "japji_ggs.wav", TIMINGS / "ggs.json"),
    "BJS": (AUDIO / "japji_BhaiJarnailSingh.wav", TIMINGS / "bjs.json"),
    "IMK": (AUDIO / "japji_IndermohanKaurUK.wav", TIMINGS / "imk.json"),
}
NAMES = list(RECITERS)
SEQS = range(5, 11)
LINES = {l["seq"]: l for l in json.load(open(HERE / "japji_lines.json", encoding="utf-8"))}
VOWEL_LETTERS = "ਅਆਇਈਉਊਏਐਓਔ"


def gurmukhi_of(seq):
    return [w for w in LINES[seq]["gurmukhi"].split() if not re.fullmatch(r"[॥੦-੯]+", w)]


KEYS = [(s, i) for s in SEQS for i in range(len(gurmukhi_of(s)))]
G = {k: gurmukhi_of(k[0])[k[1]] for k in KEYS}
LAKH = (5, 6)


def conv_gurmukhi(g, keep_terminal=False):
    """AS RECITED spelling in Gurmukhi letters: a terminal sihari/aunkar is not voiced,
    except after a vowel letter (ਲਾਇ), in -ਹਿ/-ਹੁ verb endings (ਹੋਹਿ) and in ਜੁ ਸੁ."""
    if keep_terminal or len(g) < 2 or g[-1] not in "ਿੁ":
        return g
    if g[-2] in VOWEL_LETTERS or g[-2] == "ਹ" or g in ("ਜੁ", "ਸੁ"):
        return g
    return g[:-1]


TERMINAL_KEYS = [k for k in KEYS if conv_gurmukhi(G[k]) != G[k]]   # ਸੋਚਿ ਨਾਲਿ ਪਾਲਿ ਹੁਕਮਿ ਨਾਲਿ

# (key, swapped Gurmukhi spelled as pronounced, category). Swapped forms keep their terminal
# vowel: the point of ਸੋਚੈ->ਸੋਚਿ is that the child says "sochi".
SWAPS = [
    ((5, 0), "ਸੋਚਿ", "matra"), ((5, 0), "ਸੋਚੀ", "matra"), ((5, 1), "ਸੋਚੀ", "matra"),
    ((6, 0), "ਚੁਪੇ", "matra"), ((8, 7), "ਚਲੇ", "matra"), ((8, 1), "ਸਿਆਣਪ", "matra"),
    ((10, 1), "ਰਜਾਇ", "matra"), ((10, 4), "ਲਿਖੀਆ", "matra"),
    ((5, 1), "ਸੋਚਿ", "terminal"), ((8, 8), "ਨਾਲਿ", "terminal"), ((10, 0), "ਹੁਕਮਿ", "terminal"),
    ((5, 6), "ਰਖ", "consonant"), ((10, 3), "ਨਾਣਕ", "consonant"), ((6, 8), "ਟਾਰ", "consonant"),
    ((7, 7), "ਬਾਰ", "consonant"), ((9, 6), "ਫਾਲ", "consonant"),
]
CATS = ["matra", "terminal", "consonant"]

_audio = {}


def block(name, s0=5, s1=10):
    """Audio of lines s0..s1 of one reciter with 0.3 s padding; returns (wave, t0)."""
    if name not in _audio:
        wav, lrc_path = RECITERS[name]
        lrc = {int(r["text"]): r for r in json.load(open(lrc_path, encoding="utf-8"))}
        _audio[name] = (sf.read(HERE / wav, dtype="float32")[0], lrc)
    full, lrc = _audio[name]
    t0, t1 = lrc[s0]["start"] - PAD, lrc[s1]["end"] + PAD
    return full[int(t0 * SR):int(t1 * SR)], t0


class AlignError(Exception):
    pass


def align(em, words_ids, blank, delim=None):
    """Forced-align a word list against (T, V) log-probs. Returns (words, path_logp) with
    words[i] = dict(start, end [frames], conf, gop, ntok)."""
    tokens, owner = [], []
    for wi, ids in enumerate(words_ids):
        if delim is not None and wi > 0:
            tokens.append(delim)
            owner.append(-1)
        tokens.extend(ids)
        owner.extend([wi] * len(ids))
    T = em.shape[0]
    repeats = sum(1 for a, b in zip(tokens, tokens[1:]) if a == b)
    if T < len(tokens) + repeats:
        raise AlignError(f"T={T} < L={len(tokens)} + repeats={repeats}")
    targets = torch.tensor([tokens], dtype=torch.int32)
    aligned, scores = F.forced_align(em[None].contiguous(), targets, blank=blank)
    spans = F.merge_tokens(aligned[0], scores[0].exp(), blank=blank)
    if len(spans) != len(tokens):
        raise AlignError(f"{len(spans)} spans for {len(tokens)} tokens")
    best = em.max(dim=1).values
    words = []
    for wi in range(len(words_ids)):
        sp = [s for s, o in zip(spans, owner) if o == wi]
        conf = float(np.mean([s.score for s in sp]))
        gop = float(np.mean([(em[s.start:s.end, s.token] - best[s.start:s.end]).mean().item() for s in sp]))
        words.append(dict(start=sp[0].start, end=sp[-1].end, conf=conf, gop=gop, ntok=len(sp)))
    return words, float(scores[0].sum())


def greedy(em, blank):
    ids = em.argmax(dim=1).tolist()
    out, prev = [], None
    for i in ids:
        if i != prev and i != blank:
            out.append(i)
        prev = i
    return out


def cer(hyp, ref):
    a, b = list(hyp), list(ref)
    d = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        prev, d[0] = d[0], i
        for j, cb in enumerate(b, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (ca != cb))
    return d[len(b)] / max(1, len(b))


def line_text(seq):
    return " ".join(gurmukhi_of(seq))


def run_protocol(cand, speed=True, extra=None):
    name = cand.name
    logf = open(HERE / f"bake_{name}.txt", "w", encoding="utf-8")

    def say(*a):
        s = " ".join(str(x) for x in a)
        print(s)
        logf.write(s + "\n")
        logf.flush()

    R = {"name": name, "extra": extra or {}}
    ref_path = HERE / "bake_ref_spans.json"
    ref = json.load(open(ref_path)) if ref_path.exists() and name != "mms_fa" else None

    correct = [cand.text_of(G[k]) for k in KEYS]
    written = [cand.text_of(G[k], keep_terminal=True) for k in KEYS]
    ids = [cand.ids_of(t) for t in correct]
    ids_w = [cand.ids_of(t) for t in written]
    say(f"[{name}] AS RECITED text: " + " ".join(correct))
    say(f"[{name}] AS WRITTEN differs at: " + " ".join(f"{G[k]}={written[KEYS.index(k)]}" for k in TERMINAL_KEYS))
    say(f"[{name}] tokens per word: " + " ".join(str(len(i)) for i in ids))

    # ---- A + D: correct-text alignment per reciter, as recited and as written
    ems, per, perw = {}, {}, {}
    for n in NAMES:
        wave, t0 = block(n)
        t = time.perf_counter()
        em = cand.emissions(wave)
        dt = time.perf_counter() - t
        ratio = len(wave) / em.shape[0] / SR
        ems[n] = (em, ratio, wave)
        try:
            words, lp = align(em, ids, cand.blank, cand.delim)
            ok = all(w["end"] > w["start"] for w in words)
        except AlignError as e:
            say(f"  {n}: ALIGN FAILED {e}")
            per[n] = None
            continue
        spans = [[w["start"] * ratio, w["end"] * ratio] for w in words]
        per[n] = dict(words=words, spans=spans, ratio=ratio, logp=lp, emis_s=dt, T=em.shape[0])
        durs = [e - s for s, e in spans]
        say(f"  {n}: block {len(wave) / SR:.1f}s, T={em.shape[0]} frames ({ratio * 1000:.1f} ms/frame), emissions {dt:.1f}s, "
            f"monotonic={'yes' if ok else 'NO'}, {len(words)} words, median dur {np.median(durs):.2f}s, "
            f"min dur {min(durs):.2f}s, path logp {lp:.0f}, mean conf {np.mean([w['conf'] for w in words]):.2f}, "
            f"mean GOP {np.mean([w['gop'] for w in words]):+.2f}")
        try:
            ww, lpw = align(em, ids_w, cand.blank, cand.delim)
            perw[n] = dict(words=ww, logp=lpw)
        except AlignError as e:
            say(f"  {n}: as-written ALIGN FAILED {e}")
    R["A"] = {n: (None if per[n] is None else dict(T=per[n]["T"], ratio=per[n]["ratio"], logp=per[n]["logp"],
                                                     median_dur=float(np.median([e - s for s, e in per[n]["spans"]])),
                                                     min_dur=float(min(e - s for s, e in per[n]["spans"])),
                                                     spans=per[n]["spans"])) for n in NAMES}
    good = [n for n in NAMES if per[n] is not None]
    if not good:
        say("no reciter aligned; stopping")
        json.dump(R, open(HERE / f"bake_{name}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        return R
    if name == "mms_fa":
        json.dump({n: per[n]["spans"] for n in good}, open(ref_path, "w"))
        say("  wrote reference spans")
    if ref:
        d_abs, d_signed = [], []
        for n in good:
            for (s, e), (rs, re_) in zip(per[n]["spans"], ref[n]):
                d_abs += [abs(s - rs), abs(e - re_)]
                d_signed += [s - rs, e - re_]
        R["A"]["boundary_mae_ms"] = float(np.mean(d_abs) * 1000)
        R["A"]["boundary_signed_ms"] = float(np.mean(d_signed) * 1000)
        R["A"]["boundary_p90_ms"] = float(np.percentile(d_abs, 90) * 1000)
        say(f"  boundary vs MMS_FA: MAE {R['A']['boundary_mae_ms']:.0f} ms, signed {R['A']['boundary_signed_ms']:+.0f} ms, "
            f"p90 {R['A']['boundary_p90_ms']:.0f} ms")

    say(f"\n[{name}] D) per-word GOP / conf with the AS RECITED text")
    say("key    word        " + "   ".join(f"{n}: gop/conf" for n in good))
    gops, mat = [], []
    for i, k in enumerate(KEYS):
        row = []
        for n in good:
            w = per[n]["words"][i]
            row.append(f"{w['gop']:+.2f}/{w['conf']:.2f}")
            gops.append(w["gop"])
        mat.append([per[n]["words"][i]["gop"] for n in good])
        say(f"{k[0]}.{k[1]:<2} {G[k]:<10} {correct[i]:<14} " + "   ".join(f"{r:<12}" for r in row))
    gops, mat = np.array(gops), np.array(mat)
    p10, p90 = float(np.percentile(gops, 10)), float(np.percentile(gops, 90))
    resid = (mat - mat.mean(axis=1, keepdims=True)).ravel()
    pooled = float(resid.std())
    R["D"] = dict(p10=p10, p50=float(np.median(gops)), p90=p90, mean=float(gops.mean()), n=len(gops),
                  share_zero=float(np.mean(gops > -1e-6)), pooled_std=pooled,
                  per_reciter_mean={n: float(np.mean([w["gop"] for w in per[n]["words"]])) for n in good})
    say(f"  correct-word GOP: p10 {p10:+.2f}, median {R['D']['p50']:+.2f}, p90 {p90:+.2f}, mean {gops.mean():+.2f}, "
        f"share exactly 0: {R['D']['share_zero']:.0%}, pooled within-word std {pooled:.2f}")

    # ---- as written vs as recited
    say(f"\n[{name}] AS WRITTEN vs AS RECITED (terminal sihari/aunkar kept vs dropped)")
    R["written"] = {}
    for n in good:
        if n not in perw:
            continue
        rec = [w["gop"] for w in per[n]["words"]]
        wri = [w["gop"] for w in perw[n]["words"]]
        tk = [KEYS.index(k) for k in TERMINAL_KEYS]
        R["written"][n] = dict(mean_gop_recited=float(np.mean(rec)), mean_gop_written=float(np.mean(wri)),
                               logp_recited=per[n]["logp"], logp_written=perw[n]["logp"],
                               terminal_words=[dict(word=G[KEYS[i]], recited=rec[i], written=wri[i]) for i in tk])
        say(f"  {n}: mean GOP all 47 words recited {np.mean(rec):+.3f} vs written {np.mean(wri):+.3f}; "
            f"path logp {per[n]['logp']:.0f} vs {perw[n]['logp']:.0f}; terminal words recited/written: " +
            " ".join(f"{G[KEYS[i]]} {rec[i]:+.2f}/{wri[i]:+.2f}" for i in tk))
    if R["written"]:
        cells = [(t["recited"], t["written"]) for v in R["written"].values() for t in v["terminal_words"]]
        R["written"]["share_written_higher"] = float(np.mean([w > r + 1e-9 for r, w in cells]))
        R["written"]["mean_diff_written_minus_recited"] = float(np.mean([w - r for r, w in cells]))
        say(f"  terminal words: written form scores higher in {R['written']['share_written_higher']:.0%} of "
            f"{len(cells)} cells; mean(written - recited) GOP {R['written']['mean_diff_written_minus_recited']:+.2f}")

    # ---- B: swap detection
    say(f"\n[{name}] B) swaps: GOP correct -> swapped, drop, sep_pooled = drop/pooled std, sep_word = drop/(word std + 0.05)")
    R["B"] = []
    for k, sw, cat in SWAPS:
        i = KEYS.index(k)
        sw_text = cand.text_of(sw, keep_terminal=True)
        sw_ids = cand.ids_of(sw_text)
        cor = np.array([per[n]["words"][i]["gop"] for n in good])
        std = float(cor.std())
        cells, row = [], []
        for n in good:
            t2 = list(ids)
            t2[i] = sw_ids
            try:
                w2 = align(ems[n][0], t2, cand.blank, cand.delim)[0][i]
            except AlignError as e:
                row.append(f"{n} fail")
                continue
            w1 = per[n]["words"][i]
            drop = w1["gop"] - w2["gop"]
            cells.append(dict(reciter=n, gop_cor=w1["gop"], gop_sw=w2["gop"], conf_cor=w1["conf"], conf_sw=w2["conf"],
                              drop=drop, sep_word=drop / (std + 0.05), sep_pooled=drop / max(pooled, 1e-6)))
            row.append(f"{n} {w1['gop']:+.2f}->{w2['gop']:+.2f} (conf {w1['conf']:.2f}->{w2['conf']:.2f}) "
                       f"drop {drop:+.2f} sep {cells[-1]['sep_pooled']:+.1f}/{cells[-1]['sep_word']:+.1f}")
        R["B"].append(dict(key=k, word=G[k], swapped=sw, cat=cat, text=correct[i], sw_text=sw_text, std=std, cells=cells))
        say(f"  [{cat}] {G[k]} {correct[i]} -> {sw} {sw_text} (word std {std:.2f}): " + " | ".join(row))
    width = p90 - p10
    summ = {}
    for cat in CATS:
        cells = [c for s in R["B"] if s["cat"] == cat for c in s["cells"]]
        if cells:
            summ[cat] = dict(n=len(cells), sep_pooled_gt2=float(np.mean([c["sep_pooled"] > 2 for c in cells])),
                             sep_word_gt2=float(np.mean([c["sep_word"] > 2 for c in cells])),
                             drop_gt_width=float(np.mean([c["drop"] > width for c in cells])),
                             median_drop=float(np.median([c["drop"] for c in cells])),
                             min_drop=float(min(c["drop"] for c in cells)))
            say(f"  {cat}: {len(cells)} cells, sep_pooled > 2 in {summ[cat]['sep_pooled_gt2']:.0%}, sep_word > 2 in "
                f"{summ[cat]['sep_word_gt2']:.0%}, drop > (p90-p10 = {width:.2f}) in {summ[cat]['drop_gt_width']:.0%}, "
                f"median drop {summ[cat]['median_drop']:+.2f}, min drop {summ[cat]['min_drop']:+.2f}")
    R["B_summary"] = summ

    # ---- C: delete the ਲਖ audio from line 5 (model's own span), realign line 5
    say(f"\n[{name}] C) line 5 with the ਲਖ audio removed: conf (gop) of ਲਖ and neighbours, intact -> deleted")
    l5 = [k for k in KEYS if k[0] == 5]
    l5_ids = [ids[KEYS.index(k)] for k in l5]
    j = l5.index(LAKH)
    R["C"] = {}
    for n in good:
        wave, _ = block(n, 5, 5)
        em = cand.emissions(wave)
        ratio = len(wave) / em.shape[0] / SR
        try:
            w1, _ = align(em, l5_ids, cand.blank, cand.delim)
            a, b = int(w1[j]["start"] * ratio * SR), int(w1[j]["end"] * ratio * SR)
            cut = np.concatenate([wave[:a], wave[b:]])
            em2 = cand.emissions(cut)
            w2, _ = align(em2, l5_ids, cand.blank, cand.delim)
        except AlignError as e:
            say(f"  {n}: fail {e}")
            continue
        r2 = len(cut) / em2.shape[0] / SR
        R["C"][n] = dict(lakh=[w1[j]["conf"], w2[j]["conf"]], lakh_gop=[w1[j]["gop"], w2[j]["gop"]],
                         lakh_dur=[(w1[j]["end"] - w1[j]["start"]) * ratio, (w2[j]["end"] - w2[j]["start"]) * r2],
                         prev=[w1[j - 1]["conf"], w2[j - 1]["conf"]], next=[w1[j + 1]["conf"], w2[j + 1]["conf"]],
                         others=[float(np.mean([w["conf"] for q, w in enumerate(w1) if q != j])),
                                 float(np.mean([w["conf"] for q, w in enumerate(w2) if q != j]))])
        c = R["C"][n]
        say(f"  {n}: lakh conf {c['lakh'][0]:.2f} -> {c['lakh'][1]:.2f} (gop {c['lakh_gop'][0]:+.2f} -> {c['lakh_gop'][1]:+.2f}, "
            f"dur {c['lakh_dur'][0]:.2f}s -> {c['lakh_dur'][1]:.2f}s); prev sochee {c['prev'][0]:.2f} -> {c['prev'][1]:.2f}; "
            f"next vaar {c['next'][0]:.2f} -> {c['next'][1]:.2f}; other words mean {c['others'][0]:.2f} -> {c['others'][1]:.2f}")
    if R["C"]:
        R["C"]["mean_drop_conf"] = float(np.mean([v["lakh"][0] - v["lakh"][1] for k, v in R["C"].items() if k in NAMES]))

    # ---- E: speed on the GGS block (27 s)
    if speed:
        wave, _ = block("GGS")
        R["E"] = {}
        for nt in (4, 2):
            cand.set_threads(nt)
            cand.emissions(wave)
            ts = []
            for _ in range(2):
                t = time.perf_counter()
                cand.emissions(wave)
                ts.append(time.perf_counter() - t)
            R["E"][f"threads{nt}"] = float(np.mean(ts))
            say(f"[{name}] E) emissions for {len(wave) / SR:.1f}s block, {nt} threads: {np.mean(ts):.2f}s (runs {ts[0]:.2f}, {ts[1]:.2f})")

    json.dump(R, open(HERE / f"bake_{name}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    json.dump(R, open(RUN_DIR / f"bake_{name}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    say(f"[{name}] wrote bake_{name}.json")
    logf.close()
    return R
