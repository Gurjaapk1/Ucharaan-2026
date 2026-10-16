# Interactive V1 prototype

The October 16 revision turns the selected Paper direction into a testable React web prototype at `prototype/`. It modernizes Sundar Gutka's navy, gold and Punjabi typography using assets from master. This is separate from the native feature and must not be merged as a substitute for it.

## Decisions from this conversation

- Prem Singh and Sehaj Kaur are two freely selectable, customizable characters sharing the same journey, modes and progress. They are not separate user journeys.
- The entry world offers several banis; Japji Sahib is interactive, others are previews.
- Challenge is one continuous recitation with automatic line progression and feedback only at the end. Earlier start/stop-per-line mockups are superseded.
- Practice supports selecting and repeating individual lines.
- Ten Nanak coins per newly earned star, with improvements paying only the difference. Existing mastery never decreases. Proposed thresholds are 60%, 80% and 95%, pending calibration.
- V1 rewards are digital character frames and map-marker styles. Physical book rewards and discounts remain undecided.
- No history mini-games. Pauri 1 has changing interpretive scene imagery; remaining pauris use a common landscape until content design is reviewed.
- Six regions are learning chapters in a Punjab-inspired landscape. They do not claim a historical composition location for each pauri.

## Avi's integration guidance

The latest `feature/kids-mode` commit `59e720d` contains `.agents/skills/kids-mode/SKILL.md`. It is absent from master `e949f2f`. Reviewed and mapped in `prototype/NATIVE_INTEGRATION.md`.

Native work must branch from `feature/kids-mode`, stay under `src/KidsMode/`, leave the reader untouched, keep Kids Mode off by default, and require parent opt-in for external audio processing. The skill targets grades 6–8 and starts with the first Japji Sahib pauris. The 38-pauri map is a larger design preview, not a commitment to ship all 38 for the hackathon.

## Honest prototype limits

Continuous challenge uses a four-second line timer and selectable sample scores. It does not record or assess the user's voice. Reference playback is real, using Sundar Gutka's public CDN. Progress is in memory and resets on reload. No accounts or child information are collected. Opening Mool Mantar and closing Salok are not yet lesson nodes. Character adaptations and meaning imagery need Khalis and educator review.

See `prototype/README.md`, `prototype/SOURCES.md` and `prototype/design-qa.md` for controls, provenance and verification.
