# Word feedback QA

Verified October 16, 2026.

- 16 tests pass: reward invariants, saved experience, Sites worker and word feedback.
- Word tests cover all 38 pauris at the three example score levels. Source text and combining marks are preserved; word scores are bounded and reconcile to line scores; repeated occurrences have unique IDs.
- Browser: continuous Pauri 1 challenge reaches an 84 percent result with all six lines and tappable green/red words.
- Selecting ਸੋਚੈ opens its 79 percent example score. Next word selects ਹੋਵਈ. Reference playback switches to Pause reference and can be stopped.
- Selecting ਲਾਇ identifies line 2, word 6, at 44 percent. Practice this line opens line 2 with the correct Gurbani and translation.
- The sheet initially lacked a containing height for MobileScroll. The browser adapter now supplies a relative, bounded viewport derived from device height. Rechecked the full-height coach visually.
- Production build passes and all 28 protected runtime files remain unchanged.

Scores and suggestions remain fixtures. No native binary, microphone capture, pronunciation model, word-only audio, or device accessibility certification is claimed.
