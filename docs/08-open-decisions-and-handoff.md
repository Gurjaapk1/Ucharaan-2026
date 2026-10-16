# Open decisions and implementation handoff

Draft for team review. Last updated October 16, 2026. [Context index](README.md).

## Open decisions before implementation

| Decision | Proposed starting point | Needed input |
| --- | --- | --- |
| Delivery surface | Bounded mobile-oriented demo matching the eventual Kids Mode entry | Khalis integration expectations and team platform choice |
| Practice content | One approved Japji Sahib pauri and one pankti within it | Ustaad and content provider |
| Journey story | Simple practice path, with no fictional religious claims | Team creative review |
| Currency and catalog | Neutral points and a small cosmetic set | Team and cultural review |
| Scoring scale and confidence | Defer numeric thresholds until reference data review | Ustaad and technical feasibility test |
| Local processing | Validate an on-device path first | Technical assessment on target device |
| Parent gate and retention | Explicit gate; simple local deletion; retention rule documented | Product and implementation decision |
| Mastery and rewards | Separate practice completion from repeatable skill evidence | Ustaad plus product review |

## Deferred ideas

Racing, pronunciation gates, selfie-generated avatars, 3D characters, historical character collectibles, multiplayer, adaptive curricula, extensive content, translation instruction, and an endless reward catalog remain later possibilities. They were brainstormed or inferred as extensions, not committed V1 requirements.

## Verified state

The repository contains planning Markdown and Paper screenshots/manifests. No application, speech assessment model, audio player, backend, authentication, recording pipeline, or reward persistence has been built in this work. No framework or scoring vendor has been selected. No usability or model-quality results exist yet.

## Suggested next sequence

1. Team reviews the Paper mockups and agrees the V1 journey, content boundary, and open decisions.
2. Confirm access to the ustaad, reference audio, written rules, word timings, and evaluation recordings. The BaniDB text fetch does not prove these assets exist.
3. Test the hardest technical assumptions: pronunciation measurement and word alignment on the target device while respecting the local-recording default.
4. Agree evaluation thresholds before testing. If remote processing is needed, resolve the parent-consent and data-flow change explicitly.
5. Build the bounded end-to-end practice loop, then connect real progress and cosmetic rewards.

These are proposed implementation steps, not assigned tasks or a committed schedule. Owners remain unassigned. The meeting suggested splitting technical audio/content work from creative assets and UX, but did not establish named assignments.
