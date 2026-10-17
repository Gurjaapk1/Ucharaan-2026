# Codex and native Site comparison

Compared October 17, 2026. GitHub PR #1, “Codex/v1 product journey,” is merged and points to `codex/v1-product-journey`. The fetched branch tip is `e524d4e`. The deployed native baseline came from `native/v1-product-journey` at `eaaa3c1`, plus the Site Azure adapter.

## Rewards restored in this update

The native Site now has the Codex branch’s 11 rewards across Clothing, Belongings, and Actions. Included are both garden outfits, journey satchel, explorer journal, rabab, seva basket, welcome/listening/helping actions, preview sheets, and an isolated 60-coin demo. Original icon drawings are bundled as PNGs for React Native compatibility. Buying and equipping is one state transition. Story and milestone unlocks cost no coins. Existing coins, stars, character, settings, and attempts survive migration; retired frame fields are dropped, matching Codex behavior. No frame-purchase refund is applied.

## Remaining differences

| Area | Codex product branch | Native Site |
| --- | --- | --- |
| Journey map | One connected illustrated path across 38 pauris, with scenic checkpoints every six pauris | Six illustrated region panels in a single scroll, separated by region headings |
| Pronunciation reading aid | Romanized pronunciation below Gurmukhi in practice and story views | Restored: pronunciation below Gurmukhi, followed by English meaning |
| Recall line picker | Actual Gurmukhi phrase | Restored: actual Gurmukhi phrase |
| About this picture | Passage reflection only | Restored: passage reflection only |
| Challenge | Timed simulation with sample scores | Records each line and sends it to Azure when Done with line is tapped; not automatic speech-driven advancement |
| Word feedback | Example numerical word scores and longer practice tips | Service labels, such as sounds the same/check/unclear, and shorter listening prompts |
| Word audio | Whole reference line | Can use individual reference clips if the server supplies them; current manifest has no word clips |
| Runtime | JavaScript React Native Web inside browser preview controls | Expo React Native TypeScript with web export, native audio and storage adapters |
| Phone frame | Original browser device shell | No outer phone frame, following the requested rollback |

Shared pauri/region artwork is byte-identical, and story plans match. Both versions have 38 pauris, panorama previews, memory walks, two explorer characters, best-star tracking, and 10 coins for each newly earned star.

## Validation

TypeScript passes. Eleven shared behavior tests pass against transpiled native modules, including older-save migration, purchase idempotency, independent equipment slots, milestones, stories, and star awards. Four scoring-proxy tests and the protected runtime check pass. Browser checks cover buying outfits and belongings, free story and milestone unlocks, action preview, reload persistence, demo isolation, and mobile viewport layout. Azure scoring source and runtime settings were not changed.

## Follow-up priorities

User selected the six separate region panels and real Azure scoring with manual line completion as the intended experience. Keep both. Pronunciation aids, Gurmukhi recall choices, and reflection-only picture explanations are restored from Codex. Do not replace the native app wholesale with the timed prototype.
