# Paper designs and mockups

Last updated October 16, 2026. [Context index](README.md).

[Open the editable Paper file](https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0).

## What exists

Eight planning boards contain the product overview, detailed journey, connected map, nine annotated screen concepts across three boards, acceptance criteria, and decisions/demo/sources. Beneath them are nine kid-facing 390 x 844 mobile mockups and one review-notes board. All boards were visually checked. Paper access for other team members has not been verified or changed.

These are static, editable mockups. Buttons do not demonstrate working navigation, recording, playback, inference, or purchasing. Parent setup and summary remain planning concepts rather than polished mobile mockups.

## Mobile sequence

| Screen | Preview | Purpose |
| --- | --- | --- |
| Journey home | [PNG](../outputs/paper/mockups/91-0.png) | Winding path, current practice, days and points |
| Listen and follow | [PNG](../outputs/paper/mockups/AF-0.png) | Source-checked Gurmukhi, highlighted word, playback controls |
| Recite | [PNG](../outputs/paper/mockups/BW-0.png) | Voice-position highlight, listening state, finish recording |
| Feedback | [PNG](../outputs/paper/mockups/D2-0.png) | Example score, review word, replay and retry |
| Complete | [PNG](../outputs/paper/mockups/E6-0.png) | Saved practice, points, clear permission to stop |
| Collection | [PNG](../outputs/paper/mockups/FB-0.png) | Equipped leaf, Mountain preview, future sun unlock |
| Preview | [PNG](../outputs/paper/mockups/GX-0.png) | Price and remaining balance before unlock |
| Unlock | [PNG](../outputs/paper/mockups/I3-0.png) | Ownership confirmation and equip action |
| Audio recovery | [PNG](../outputs/paper/mockups/J2-0.png) | Neutral retry without inventing a score |

## Design direction

Botanical palette: parchment #F6F5EE, ink #20352D, moss #38664B, pale leaf #E4EDDF, brass #A77B28, muted red #A33F40. The mockups also use light gold surfaces and related leaf shades. Inter handles controls; Noto Sans Gurmukhi handles bani. Large text and quiet practice areas take precedence over decoration. Nature avatars are editable vector geometry. This is a proposed visual direction, not an approved Khalis brand system.

## Sample data and sacred text

The sample line is BaniDB Japji Sahib, bani ID 2, verse ID 16, within Pauri 1:

> ਸੋਚੈ ਸੋਚਿ ਨ ਹੋਵਈ ਜੇ ਸੋਚੀ ਲਖ ਵਾਰ ॥

[Source text](https://api.banidb.com/v2/banis/2) was fetched and checked on October 16. The choice of ਸੋਚਿ as a weak word, the score of 82/100, and word timings are fictional. No ustaad approval or pronunciation guidance is implied. The mockups deliberately avoid inventing a linguistic correction.

The illustrative balance moves from 40 to 50 after a +10 completion reward, then to 20 after a 30-point Mountain unlock. Little leaf is already equipped; Morning sun costs 60. These amounts and names are not approved economy rules.

## Remaining design work

Review age fit and cultural treatment; approve the journey story and currency name; specify parent access; add ready/processing, missed-tap, insufficient-balance, and other missing states before implementation as needed. A static screenshot does not validate tap timing, Gurmukhi layout across devices, accessibility, speech accuracy, or local processing.

[Planning manifest](../outputs/paper/manifest.json) and [mockup manifest](../outputs/paper/mockups/manifest.json) preserve Paper references. The planning manifest is an earlier snapshot; the mockup manifest lists the later mockup boards.
