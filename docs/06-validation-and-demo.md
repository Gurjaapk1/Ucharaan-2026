# Validation and five-minute demo

Draft for team review. Last updated October 16, 2026. [Context index](README.md).

## Acceptance before calling V1 complete

1. A parent enables Kids Mode, and the child can complete one approved pauri's tap-along and one pankti's recitation without developer help.
2. Audio/text alignment is compared with hand-marked word timings. Report observed error distribution and failures. The acceptable timing window must be agreed before evaluation.
3. On a held-out set of consented sample recordings, compare scores and selected review words with ustaad judgments. Include correct, incorrect, silent, and noisy examples. Set acceptable agreement thresholds with the ustaad before testing; do not claim accuracy from a scripted demo.
4. Voice-following works on the supported pankti, including pauses and a failed-tracking recovery. Unsupported content is clearly labeled.
5. Low-confidence recordings produce a retry state, not authoritative correction. Scoring failure never becomes a judgment about the child's effort or faith.
6. Journey state, currency, and equipped rewards persist. Replay and interruption checks show no duplicate awards or charges.
7. Recording storage and actual network traffic confirm the local default. Deletion and permission refusal are manually tested.
8. The parent summary matches saved practice and does not inflate pauri completion into bani completion or practice into mastery.
9. A child usability walkthrough establishes whether the next action and feedback are understood. Record observations rather than inventing engagement results.
10. Code licensing is MIT as requested in the brief; reference audio, fonts, text, and artwork have separately verified usage rights.

## Five-minute demonstration

| Time allocation | What to show |
| --- | --- |
| 0:00 to 0:35 | Parent enables Kids Mode and reviews recording default |
| 0:35 to 1:00 | Child sees the journey and selects the approved practice |
| 1:00 to 2:00 | Tap-along with visibly synchronized words, including a missed tap |
| 2:00 to 3:15 | Recite one pankti; show score, specific review word, and ustaad replay |
| 3:15 to 3:50 | Retry, save practice, earn an eligible award, return to journey |
| 3:50 to 4:15 | Cosmetic unlock and short parent summary |
| 4:15 to 5:00 | Actual comparison with ustaad judgments and hand-marked timings; state limitations |

This is a proposed pacing plan. The demonstration must distinguish live behavior, prerecorded examples, and unimplemented screens.
