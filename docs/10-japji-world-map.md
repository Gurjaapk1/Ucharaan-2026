# Japji Sahib world map

October 16, 2026. The user selected the map direction and requested a fuller game-like presentation inspired by Overcooked, with per-pauri practice routes, three-star mastery, a scorecard and Nanak coins. React Native is the intended app technology. This replaces the prior recommendation to lead with the story-plus-mastery home screen. Detailed scoring and economy remain proposals.

[Open Paper](https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0). Eight new phone screens start below the earlier alternatives, followed by a complete-world board. [Screenshot and asset folder](../outputs/paper/world-map/).

## Experience

The child enters an illustrated riverside world. Numbered pauri nodes sit on a winding path across bridges. Each node displays its earned stars. Tapping a node reveals the pauri's best mastery and two routes: focused verse practice or full-pauri recitation. A scorecard returns the child to a specific practice target or the map. Three-star mastery awards a larger one-time Nanak coin bonus.

The full-world board includes all 38 pauris, grouped into six learning regions: Riverside 1–6, Fields 7–12, Grove 13–18, Hills 19–24, Lake 25–30 and Garden 31–38. Opening verses and closing salok remain part of the overall sequence, outside the 114 possible pauri stars. These regions are invented learning organization, not historical composition locations. The full-world board is an overview for the team; a phone should zoom into a region rather than squeeze 38 small targets onto one viewport.

## Screens delivered

1. Map entry: six first-region destinations, current pauri, visible stars and wallet.
2. Pauri destination: focused verse practice and full-pauri routes, best result and next milestone.
3. Verse selector: practiced and focus-next lines, with continuation below the visible list.
4. Full-pauri recitation: reference listening, text guide and a calm recording entry state.
5. Scorecard: a new second star, targeted line to revisit, coin award and next-star incentive.
6. Focused pronunciation: Gurmukhi line, reference audio, slower playback, recording and own-attempt playback.
7. Nana rewards: balance and cosmetic flag/journal previews.
8. Three-star result: saved mastery, one-time bonus and next destination.
9. Complete-world board: all 38 numbered pauris, route explanation, proposed mastery ladder and React Native direction.

Screens are editable Paper designs, not functioning app screens. Asset generation produced two original terrain illustrations. No app code or scoring model was built. Pauri 3 is an illustrative expanded-design example; this does not change the previously bounded Pauri 1 playable-demo scope without a subsequent implementation decision.

## Proposed mastery model

A line has practice status and a suggested focus. It does not automatically grant the same star as a full-pauri result. Full-pauri attempts establish the pauri's best star record. This avoids implying that completing isolated exercises proves fluent full-pauri recitation.

- First star: a supported full attempt, subject to a minimum valid-recitation rule.
- Second star: an educator-approved pronunciation accuracy criterion.
- Third star: repeatable full-pauri performance against the approved mastery criterion.

These are candidate criteria, not calibrated rules. The first star mixes completion and competence, so the team must explicitly approve that meaning or reserve all stars for accuracy. Do not choose arbitrary numeric thresholds from the earlier brainstorm. Keep current-attempt feedback separate from the best saved stars. Silence, recording failure or uncertain assessment should be unscored and recoverable. Replays never remove previously earned stars. Three-star perfection is not required to continue practicing elsewhere.

The mockup starts with 9 of 18 stars in the first region and 9 of 114 across all pauris. Pauris 1–6 show 3, 3, 1, 2, 0, 0. The Pauri 3 scorecard then illustrates moving from one to two stars. Map and overview are pre-attempt states, not the updated post-scorecard state. In the built app, that result would update those totals to 10. A separate three-star result shows the later milestone.

## Nanak coins

The user requested the name Nanak coins. The user subsequently confirmed this spelling. Proposed economy examples are a 240-coin starting balance, a one-time 20-coin second-star award, a resulting 260 balance, and a later one-time 30-coin third-star award. Reward previews show a 120-coin flag and 180-coin journal cover. These are illustrative prices and awards, not agreed economics.

Stars are permanent mastery records. Coins are spendable cosmetic rewards. Coins never buy stars, access to bani, or a better assessment. A claimed milestone cannot pay again on repeated attempts or retries. No paid currency, cash value or purchasing flow is proposed. The final reward screen is a later state than the 260-coin shop example; its balance would be 290 before any spending.

## Visual and icon direction

Use a softly modeled miniature world with raised grass, river bends, rounded trees, field textures and wooden bridges. Maintain a quiet recitation screen even when the map is playful. The terrain is decorative; all numbers, star status and interaction labels are separate editable elements.

The icon vocabulary is consistent: headphones for reference/listening practice, microphone for recitation, star for mastery, coins for the wallet, book for journal/context, flag for map personalization, check for practiced status. These are Lucide icons with a retained license, not invented religious emblems. Nunito supplies rounded headings and controls; Noto Sans Gurmukhi displays bani. Do not turn Gurbani text or Guru Nanak into spendable or equipped game objects.

The requested Overcooked reference informed terrain, connected destinations and stars, not a copied asset set. Its publisher confirms map-visible score/star boundaries and the regular campaign's three-star target. [Team17 release notes](https://www.team17.com/news/overcooked-2-new-game-available-now-for-all-platforms). Visual reference: [publisher's Steam screenshots](https://store.steampowered.com/app/728880/Overcooked_2/).

## React Native handoff

This is a proposed rendering approach, not a selected dependency stack. Use a layered map illustration with a coordinate model for destinations, and separate native press targets, text and status. A region can pan; tap-to-select opens a sheet or destination screen. Provide an equivalent pauri list for screen-reader and reduced-motion use. Maintain a minimum 44-point target even if a decorative marker is smaller. The desktop overview's tiny nodes are not the mobile target size.

Keep the region art's aspect ratio, store destination positions in normalized coordinates and place labels independently of the artwork. Native components handle headings, buttons, sheets, wallet and scorecard. Do not require a 3D engine, a Swift-only component or CSS from the Paper export. Test map gestures, text scaling, audio interruption and device memory before choosing extra libraries. Reduce or remove decorative motion when requested.

Persist line practice, pauri attempts, best stars and milestone claims independently. Reward awards must survive retries without duplication. Content references, narration and pronunciation rules need approved versions. The illustrated terrain JPG exports are reference backups; obtain production-resolution assets and device-specific compression during implementation.

## Content and verification

Pauri 3's two displayed Gurmukhi lines and 14-line segmentation were checked against the existing local BaniDB response at `tmp/uchaaran-japji.json` in the orchestration root, paragraph 6. This is a source check, not educator approval. No audio alignment or pronunciation feedback was validated. The scorecard's line-2 focus is illustrative.

Historical context remains available through the journal. A map world should not imply that its pauris were composed at its locations. The prior [history research](../research/history-framing-2026-10-16.md) still applies.

Visual checks covered map label placement, 38 unique numbered nodes, Gurmukhi rendering, scorecard hierarchy, coin arithmetic and screen fit. The next decisions are star criteria, coin award values, cosmetic scope, and the amount of historical content available from the map. Test the map-to-practice-to-scorecard loop with children before expanding the playable content.

## Subsequent refinement

[History, challenge and rewards](11-history-challenge-and-rewards.md) supersedes the initial star ladder with the requested percentage-based direction and changes Challenge mode to sequential line recordings with a final rubric. The earlier terrain and continuous-recording concept remain historical design alternatives.
