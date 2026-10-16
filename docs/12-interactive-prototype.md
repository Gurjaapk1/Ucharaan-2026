# Interactive V1 prototype

The October 16 revision turns the selected Paper direction into a testable React web prototype at `prototype/`. It modernizes Sundar Gutka's navy, gold and Punjabi typography using assets from master. This is separate from the native feature and must not be merged as a substitute for it.

## Decisions from this conversation

- Prem Singh and Sehaj Kaur are two freely selectable, customizable characters sharing the same journey, modes and progress. They are not separate user journeys.
- The entry world offers several banis; Japji Sahib is interactive, others are previews.
- Challenge is one continuous recitation with automatic line progression and feedback only at the end. Earlier start/stop-per-line mockups are superseded.
- Practice supports selecting and repeating individual lines.
- Ten Nanak coins per newly earned star, with improvements paying only the difference. Existing mastery never decreases. Proposed thresholds are 60%, 80% and 95%, pending calibration.
- V1 rewards are digital character frames and map-marker styles. Physical book rewards and discounts remain undecided.
- No history mini-games. Pauri 1 has a connected, quiet painted panorama. Other pauris remain text-first until their visual cues are reviewed.
- Six regions are learning chapters in a Punjab-inspired landscape. They do not claim a historical composition location for each pauri.

## Avi's integration guidance

The latest `feature/kids-mode` commit `59e720d` contains `.agents/skills/kids-mode/SKILL.md`. It is absent from master `e949f2f`. Reviewed and mapped in `prototype/NATIVE_INTEGRATION.md`.

Native work must branch from `feature/kids-mode`, stay under `src/KidsMode/`, leave the reader untouched, keep Kids Mode off by default, and require parent opt-in for external audio processing. The skill targets grades 6–8 and starts with the first Japji Sahib pauris. The 38-pauri map is a larger design preview, not a commitment to ship all 38 for the hackathon.

## Honest prototype limits

Continuous challenge uses a four-second line timer and selectable sample scores. It does not record or assess the user's voice. Reference playback is real, using Sundar Gutka's public CDN. Progress, wardrobe and preferences persist in this browser; there is no cross-device sync. No accounts or child information are collected. Opening Mool Mantar and closing Salok are not yet lesson nodes. Character adaptations and meaning imagery need Khalis and educator review.

See `prototype/README.md`, `prototype/SOURCES.md` and `prototype/design-qa.md` for controls, provenance and verification.

## Source-aligned React Native Web update

The current Site starts at a Sundar Gutka home preview. Open Settings, enable Kids Mode, and choose an explorer to enter the journey. The app-owned UI now uses React Native primitives under `prototype/src/KidsMode/`, rendered with React Native Web. The browser shell, scrolling, icon rendering and audio live behind adapters.

The original navy header, Punjabi title, ornamental glyphs, full-width bani rows, grouped settings, reading typography and navigation treatment guide the revised design. Night mode, font sizing and English-meaning controls work in the preview. Journey, continuous demo challenge, rubric, stars, Nanak coins and cosmetic rewards remain.

This is source-aligned rather than a verified pixel match to a native binary. The native integration contract identifies reusable files and the remaining Redux, navigation, database, audio and scoring work.

## Pauri 1 reference revision

The user selected Pauri 1 for the first polished visual sequence. Its six lines now share a connected panoramic place, with stable landmarks, an explorable story mode and optional recall practice. The first region has matching map art. Recent attempts, next-pauri continuation and local persistence support a fuller test loop. Sample-score controls are now in Settings. See [the visual story specification](14-visual-story-and-full-feature-preview.md).

## Word-level challenge feedback

The result now displays the full pauri with tappable word scores. Red underlined words open a practice coach with example guidance, slower reference-line audio and exact-line retry. Recitation remains continuous. See [the feedback contract](16-word-level-feedback.md); no microphone or AI assessment is connected.
