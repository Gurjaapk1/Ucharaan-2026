# Japji Sahib artwork set

The October 16, 2026 expansion creates 39 new illustrations: Pauris 2–38, an opening contemplation image, and a closing Salok image. Together with the retained Pauri 1 reference, the set contains 40 landscapes. The app now offers a memory walk and supporting imagery for all 38 pauris in Practice and Challenge.

## Visual structure

One continuous landscape belongs to each pauri. A river and sandy footpath connect the collection; sage greens, ochre, powder blue and ivory keep it within the existing visual style. Four landmarks per new pauri cover related groups of lines. Pauri 1 retains its six individual landmarks. All 374 lesson lines are covered exactly once by the ordered landmark ranges.

The view moves only when the active landmark changes. Related lines can stay on one image. The overview shows the entire panorama; the four or six landmark buttons jump to the first line in each group. Next and Previous still move one line at a time. Reduced motion, optional illustrations, Roman transliteration, English meanings and fixed reading controls remain available.

The set is mnemonic interpretation, not a translation or theological diagram. No scene depicts God, a Guru, a deity or a supposed composition location. Abstract passages use open horizons, paths and natural forms. Pauri 18 avoids violent scenes. Pauri 38 shows a workshop without coins, so its Shabad metaphor is not conflated with the app's reward currency. Opening and Salok images are available in the review gallery, not added as scored lessons.

## Files and review

- `prototype/public/art-review.html`: responsive gallery with all 40 images, an index and pauri line ranges. Rebuild with `node scripts/build-art-review.mjs` from `prototype/`.
- `prototype/public/assets/japji/`: 39 JPEG runtime images, about 12 MB in total. Individual reading screens request only their current panorama.
- `outputs/japji-art/source/`: original generated PNGs, preserved without overwriting Pauri 1.
- `outputs/japji-art/prompts.json`: generation prompts used with the built-in image tool.
- `outputs/japji-art/assets.json`: runtime file sizes and SHA-256 hashes.
- `outputs/japji-art/review/`: contact sheets for visual review.
- `prototype/src/KidsMode/story-plans.json`: explicit zero-based inclusive line ranges, mnemonic copy and camera positions.

The existing BaniDB text and meanings in `prototype/src/bani.json` provided the content basis. The opening and Salok were checked against the previously captured BaniDB Japji export, verse IDs 12–15 and 390–396. The exact scripture data, timings and transliteration in the app remain unchanged.

## Verification and remaining review

The new coverage checks verify all 38 pauris, every line, ordered camera movement and a distinct existing image for each pauri. Existing scoring, wardrobe and persistence tests remain in place. The protected phone runtime is unchanged.

Every generated image was inspected in a contact sheet. These are complete prototype assets, not educator-approved illustrations. Review whether the metaphors help recall without distorting meaning, especially Pauris 16, 18, 26, 30 and 34–38. Child comprehension and native-device rendering remain untested. The six map regions now have distinct terrain derived from these panoramas. See [region maps and pauri previews](21-region-maps-and-panorama-entry.md). Live speech alignment remains simulated.

Local browser verification reached Pauri 38 from region six, opened its memory walk, jumped to the fourth landmark at line six, and advanced to line seven with the correct final action. The image, Gurmukhi, transliteration and English meaning rendered together without overlap. The gallery index also opened Pauri 38 and the closing Salok correctly. Evidence: `outputs/japji-art/review/pauri-38-phone.png`.

Final validation: production build passed, 17 domain tests plus four Sites worker tests passed, and the unchanged 28-file runtime integrity check passed. Canonical `bani.json` has no diff.
