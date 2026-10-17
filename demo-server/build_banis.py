import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
# Regenerates banis/ and timings/ from the Sundar Gutka app (run by hand when the app's data changes):
#   python build_banis.py <sundar-gutka>/android/app/src/main/assets/www/gutka_v01.db \
#                         <sundar-gutka>/src/ReaderScreen/components/AudioPlayer/assets/lyrics
# Text: mv_Banis_Shabad (Seq = the verse number the app's reader and lyric files use).
# Audio: the reciter tracks the app streams (src/services/audioApi.js static maps) and their line-timing
# JSONs ({start, end, text=Seq}), copied verbatim into timings/.
import json, shutil, sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
FOLDER = {"bjs": "BhaiJarnailSingh", "imk": "IndermohanKaurUK", "ggs": "GianiGurdevSingh"}
# bani id -> reciter -> (track under the CDN folder, lyric JSON under the CDN folder), as audioApi.js pairs them
TRACKS = {
    2: {"bjs": ("JapjiSahib.m4a", "japji-sahib.json"), "imk": ("JapjiSahib.m4a", "JapjiSahib.json"),
        "ggs": ("JapjiSahib.m4a", "JapjiSahib.json")},
    4: {"bjs": ("JaapSahib.m4a", "jaap-sahib.json"), "imk": ("JaapSahib.m4a", "JaapSahib.json"),
        "ggs": ("JaapSahib.m4a", "JaapSahib.json")},
    6: {"bjs": ("Saviye.m4a", "saviye.json"), "imk": ("TavParsadSwayiye.m4a", "TavParsadSwayiye.json"),
        "ggs": ("TavParsadSwayiye.m4a", "TavParsadSwayiye.json")},
    9: {"bjs": ("ChaupaiSahib.m4a", "chopai-sahib.json"), "imk": ("ChaupaiSahib.m4a", "ChaupaiSahib.json"),
        "ggs": ("ChaupaiSahib.m4a", "ChaupaiSahib.json")},
    10: {"bjs": ("AnandSahib.m4a", "anand-sahib.json"), "imk": ("AnandSahib.m4a", "AnandSahib.json"),
         "ggs": ("AnandSahib.m4a", "AnandSahib.json")},
    21: {"bjs": ("RehrasSahib-trimmed.m4a", "Rehras-sahib-trimmed.json"), "imk": ("RehrasSahib.m4a", "RehrasSahib.json")},
    23: {"bjs": ("KirtanSohaila-trimmed.m4a", "kirtan-sohaila-trimmed.json"),
         "imk": ("KirtanSohaila.m4a", "KirtanSohaila.json")},
}
# Japji keeps the file names the bake-off scripts and fetch_assets.py already use
JAPJI = {"ggs": ("japji_ggs", "ggs.json"), "bjs": ("japji_BhaiJarnailSingh", "bjs.json"),
         "imk": ("japji_IndermohanKaurUK", "imk.json")}


def main(db_path, lyrics_dir):
    db = sqlite3.connect(db_path)
    lyrics_dir = Path(lyrics_dir)
    (HERE / "banis").mkdir(exist_ok=True)
    (HERE / "timings").mkdir(exist_ok=True)
    catalog = []
    for bani, recs in TRACKS.items():
        token, name, translit = db.execute("SELECT Token, GurmukhiUni, Transliterations FROM Banis WHERE ID = ?",
                                           (bani,)).fetchone()
        rows = db.execute("SELECT Seq, GurmukhiUni FROM mv_Banis_Shabad WHERE Bani = ? ORDER BY Seq", (bani,)).fetchall()
        assert len({s for s, _ in rows}) == len(rows), f"duplicate Seq in bani {bani}"
        with open(HERE / "banis" / f"{bani}.json", "w", encoding="utf-8") as f:   # one verse per line
            f.write(f'{{"id": {bani}, "token": "{token}", "lines": [\n')
            f.write(",\n".join(json.dumps([s, g], ensure_ascii=False) for s, g in rows) + "\n]}\n")
        reciters = {}
        for rec, (track, lyrics) in recs.items():
            stem, timing = JAPJI[rec] if bani == 2 else (f"{token}_{rec}", f"{token}_{rec}.json")
            src = lyrics_dir / FOLDER[rec] / lyrics
            if bani == 2:
                assert (HERE / "timings" / timing).read_bytes() == src.read_bytes(), f"{timing} differs from {src}"
            else:
                shutil.copyfile(src, HERE / "timings" / timing)
            seqs = {s for s, _ in rows}
            lyric_seqs = [int(str(r["text"]).strip()) for r in json.load(open(src, encoding="utf-8"))]
            assert set(lyric_seqs) <= seqs, f"{src}: seqs not in the bani"
            reciters[rec] = dict(track=f"{FOLDER[rec]}/{track}", lyrics=f"{FOLDER[rec]}/{lyrics}", audio=stem,
                                 timings=timing, lines=len(lyric_seqs))
        catalog.append(dict(id=bani, token=token, name=name, translit=json.loads(translit)["en"], reciters=reciters))
        print(f"bani {bani} {token}: {len(rows)} lines, reciters " +
              ", ".join(f"{r} {v['lines']}" for r, v in reciters.items()))
    json.dump(catalog, open(HERE / "banis" / "catalog.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(*sys.argv[1:3])
