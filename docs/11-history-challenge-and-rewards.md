# Historical journey, challenge mode and rewards

October 16, 2026. This revision incorporates the user's correction to **Nanak coins** and requests for historical context, character onboarding, optional regional mini-games and percentage-based challenge results. [Open Paper](https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0). Nine new phone mockups and a decision board are saved in [the screenshot folder](../outputs/paper/historical-challenge/).

## Current direction

Enter through character selection and a world map. Each pauri offers Practice mode and Challenge mode. Practice allows targeted lines, reference listening, slower playback, own-recording playback and repeated attempts. Challenge presents the whole pauri line by line in sequence, then provides a final pronunciation rubric, percentage and stars. The user explicitly selected this distinction. It supersedes the earlier assumption that a full challenge must be one continuous recording.

The new scorecard uses green Strong and red Revisit labels. Color is not the only indicator. Tapping a line should open its recording, reference and focused practice. The present mockup gives line-level results; word-level alignment and exact pronunciation diagnosis still require a validated assessment system.

The demo displays 14 Pauri 3 lines. The Gurmukhi sample and segmentation reuse the previously checked BaniDB source. The app still needs educator-approved content and audio. These screens expand the design, not the previously bounded playable-demo implementation.

## Historical chapter proposal

Japji Sahib contains 38 pauris, plus opening and closing material. Six groups of 6, 6, 6, 6, 6 and 8 are proposed. They are learning chapters rather than six proven composition sites.

| Pauris | Context chapter | Visual direction and review requirement |
| --- | --- | --- |
| 1–6 | Talwandi | Early-life context with village paths and fields. Specific stories require source review. |
| 7–12 | Sultanpur Lodhi | Life and work, with a settlement, grain store and footpaths. The generated layout is interpretive. |
| 13–18 | The Bein | River landscape and a clearly attributed tradition. Do not present a tradition as settled composition chronology. |
| 19–24 | Journeys and encounters | Choose individual sourced encounters before drawing detailed travel routes. No unverified route map. |
| 25–30 | Kartarpur | Later community and Ravi-side context. Buildings and landscape need historical review. |
| 31–38 | Life in community | Return to Kartarpur for work, learning and sharing. This is not a sixth historical location. |

The map illustration shows a Sultanpur-inspired settlement, fields, river, trees and crossing. These are artistic scene choices, not an archaeological reconstruction or proof that Pauris 7–12 were written there. The later Bein chapter can revisit the same broader setting rather than pretending it is a separate distant place.

Punjabi University's Japu entry says composition date and manner are disputed. It identifies a Kartarpur arrangement as conjecture and a River Bein account in a Janam Sakhi tradition. Preserve those distinctions in parent/source notes. [Punjabi University, Japu](https://eos.learnpunjabi.org/JAPU.html).

SGPC's January 2020 publication describes Guru Nanak's move from Talwandi to Sultanpur Lodhi and his employment there. [SGPC publication](https://sgpc.net/gazette/2020/January/January-English.pdf). The earlier [historical research note](../research/history-framing-2026-10-16.md) includes the previously reviewed SGPC life account supporting Kartarpur community context. That webpage timed out on the latest refresh; it is not newly reverified here. The mock Story Match question uses that context and still needs educator approval before shipping.

## Challenge rubric proposal

The requested percentage-to-stars mechanism is now visible. For design discussion only, the mockup uses:

| Percentage | Stars |
| --- | --- |
| Below 60 | No new star; offer focused practice |
| 60 to below 80 | One |
| 80 to below 95 | Two |
| 95 to 100 | Three |

These values are invented examples for reviewing the UI, not accuracy claims, learning standards or agreed thresholds. The earlier supported/accurate/consistent star ladder is superseded as the displayed direction. The educator must define the pronunciation rubric and validate score reliability before deciding the cutoffs.

The example line scores are 92, 68, 95, 91, 85, 90, 93, 76, 91, 87, 94, 75, 90 and 77. Their simple mean is 86%, giving two stars under the example bands. Ten lines are at least 80; four are below. Lines 2, 8, 12 and 14 are the focus lines. The equal-line weighting is mock arithmetic only. A production rubric must decide how words, pronunciation features, line length and assessment confidence affect the overall score.

Do not turn microphone failure, silence or uncertain alignment into a red pronunciation judgment. Show an unscored state and recover the recording first. Challenge results should appear after the last line, but capture problems must be flagged immediately. Preserve the best stars separately from the current attempt. Store the rubric version with each result. Save-and-leave resumes at the next unfinished line; restart and reference-help policies need explicit definition.

## Mini-games between regions

Recommend a bonus stop after completing all challenges in a region, without requiring three stars. It unlocks an optional game and does not block the next region. There are five between-region transitions and an optional final celebration after region six.

| Concept | Why choose it | What it needs |
| --- | --- | --- |
| Story Match | Reinforces place and story recall; strongest connection to the historical journey | Approved stories, simple questions, narration, hint and explanation for every answer |
| Trail Builder | Gives a spatial break from listening and recitation | A short untimed path puzzle that does not claim to replay a historical event |
| Listening pairs | Keeps attention on sound | Carefully reviewed clips and an age-appropriate matching task; avoid trivializing sacred text |

Paper includes the bonus-stop menu and the first Story Match question. Trail Builder is an alternative concept, not a designed or implemented game. Begin with Story Match, then test whether children prefer a nonverbal puzzle break. A wrong answer should explain and allow retry, not remove coins or progress. Completing a game can add an earned journal sticker. Mini-games do not award pronunciation stars.

## Character onboarding and rewards

The child chooses a fictional contemporary learner, not Guru Nanak. Four starter avatars illustrate appearance variety. All starter characters, skin tones, headwear and hair choices stay free and revisable. The selection image is a concept asset; implementation needs independent accessible choices and separately usable character assets.

The wardrobe shows an optional River Explorer outfit for 120 Nanak coins. Other proposed rewards are backpacks, trail flags and journal covers. Earned stickers can commemorate story discoveries and region completions. Keep religious identity choices, bani access and scoring independent of spending.

Recommended first reward set: two cosmetic outfits, two trail flags, two journal covers and region stickers. This is a planning recommendation, not a final asset count. Defer randomized rewards, purchasable currency, score boosts and physical rewards. Family-sponsored real-world rewards would require a separate parent-controlled proposal.

Example awards are 20 coins for a newly earned second star, 30 for a third star and 25 for first region completion. Values remain open. Each milestone pays only once, including after retries or app restarts. Mini-games may be replayed without repeated coin payouts. The wardrobe's 260 balance and 120 price imply 140 after purchase. Add a clear purchase confirmation, insufficient-balance state and Owned/Equip state during interaction design; the current screen is a preview.

## React Native and accessibility

React Native remains the intended technology. Keep illustrated terrain, avatar art, route positions, labels and controls separate. Give map nodes, avatar options and rubric rows at least 44-point interactive areas. The compact all-lines board is a review overview; production should use taller scrolling rows rather than preserve its 31-point row height. Announce line number, status and score to screen readers. Red and green must remain paired with text and, where useful, icons. Reflow large Gurmukhi text without clipping.

Use optional motion and avoid countdowns, lives or rapid-tap mechanics during recitation. Preserve microphone permission and interruption recovery. Onboarding here covers character personalization only; existing parent setup and recording privacy requirements still apply.

## Delivered and open

Delivered: nine new phone designs, one comparison board, three generated illustration assets, corrected live coin labels and local screenshot backups. Visual checks confirmed text fit, the full 14-row rubric, map markers and character selection. No app, mini-game, audio scorer or historical curriculum was implemented.

Next decisions: approve the historical chapter pairing, choose the first mini-game, define rubric and star bands, and choose the initial reward set. The scene details and story text require content review before production.
