# Word-level challenge review

After uninterrupted recitation, show the complete pauri with each assessed word highlighted. Green means clear; red with an underline means practise. Keep the existing overall percentage, stars and Nanak coin award. Do not interrupt the challenge to correct individual words.

Tap a word to open Practice coach with its percentage, line and word position, a short practice prompt, slower reference-line audio and a route into that exact practice line. A separate Review words to practise button and Next word to practise action offer an easier way through the weak words.

## Prototype boundary

Scores and suggestions are examples. No voice is recorded or assessed. The prompts model first-sound, ending and whole-word practice; they are not phonetic diagnoses. Audio plays the complete reference line because verified word timings are not available. The current threshold for highlighting is 80 percent and needs educator calibration.

Tokenization preserves the exact source text, whitespace, combining marks and punctuation. Repeated words have distinct occurrence IDs. Punctuation and pauri numerals are not graded. Each word carries line index, word index and UTF-16 start/end offsets into the unchanged source line. Fixture scores average to the displayed line score; this is a consistency rule for the demo, not a proposed production scoring algorithm.

## AI integration contract

Replace sampleWordReview and practicePrompt with the scoring service response. Bind every result to an immutable attempt ID, source version, pauri ID, line ID and word occurrence. Agree on offset encoding with the backend; never assume byte, Unicode scalar and UTF-16 offsets are interchangeable.

Return score, confidence, assessment status and a validated issue code separately. Low-confidence or missing audio must produce an unscored state, not a red failure. Define how word and line assessments contribute to the overall score before awarding stars. Use persisted attempt IDs for idempotent rewards.

The coach should explain one confidently detected issue using educator-reviewed guidance, offer the matching reference segment, and let the child retry in context. An AI may personalize that explanation, but must not rewrite canonical Gurbani or invent a pronunciation rule. Word-only playback requires reviewed start/end timings. Keep the full-line fallback clearly labeled.

Follow Avi's parent opt-in and local recording rules before any recording leaves the phone. No such recording integration is included in this preview.

## Reuse

WordReview uses shared React Native primitives. The host supplies a Sheet adapter: the web preview uses the existing phone bottom sheet; native integration should use the app's accessible modal or sheet with bounded scrolling and safe areas. Test Gurmukhi shaping, keyboard/screen-reader selection, short-word touch targets and large text on devices before shipping.
