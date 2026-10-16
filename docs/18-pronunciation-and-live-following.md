# Pronunciation support and recitation following

Practice and the Pauri 1 memory walk show three layers in order: canonical Gurmukhi, Roman-letter Punjabi transliteration, then the existing English meaning when meanings are enabled. Recall mode hides the complete stack until Show the words is selected. The source is BaniDB transliteration.en, matched against paragraph, line order and exact Unicode Gurbani for all 374 lesson lines. This is a reading aid; reference audio remains the pronunciation model.

## Final app requirement

The app follows a continuous recording through the selected recitation, whether one pauri or a longer bani session. Track bani, pauri, line and word position together so progress remains meaningful across pauri boundaries. It maintains the current word and line position from streaming alignment against that pauri's canonical text. Advance automatically only after sufficient evidence that the current line has been recited. Never advance because a fixed number of seconds passed. Silence, pauses and uncertain alignment hold the current line. Repeated words must be resolved in local context rather than matching a word elsewhere in the pauri.

Completion and pronunciation quality are separate. An imperfect but completed line can advance and receive correction in the final word-level review. Do not require a perfect score before advancing. Do not quietly skip an unrecited line. If alignment is lost, keep the current line, show a calm listening state and offer an explicit retry or manual recovery control. Manual recovery must be recorded separately from observed completion.

The service should emit attempt ID, source version, pauri ID, line/word occurrence, audio offsets, confidence, provisional/final status and line-complete events. Ignore stale or out-of-order events, commit each line completion once, and stop capture on explicit pause or exit. Timing thresholds and behavior with hesitations, repeats, corrections and background speech need native-device and educator validation.

## Prototype boundary

No microphone or speech recognizer is connected. The current challenge still uses timed demonstration playback and explicitly says so. It does not claim to hear or follow a child. Real speech following requires the team's recording and alignment backend under the existing parental-consent rules.
