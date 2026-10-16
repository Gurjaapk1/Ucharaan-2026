# Connected visual story and fuller preview

## Agreed scope

Polish Pauri 1 first, then apply the reviewed approach across Japji Sahib. The user selected this scope on October 16, 2026. The existing Sundar Gutka shell, characters, journey, stars and Nanak coins remain.

## Recommended approach

Use one continuous illustrated place per pauri. A stable route connects one memorable landmark to each line. Show the whole place first, then move the camera to a landmark as that line is read or practised. Reuse that exact view in recall practice and challenge mode.

For Pauri 1, the route runs from a riverside pool through a quiet grove, grain store, winding maze and misty threshold into open fields. It is one world with consistent light, materials and geography. The child learns the location of the cues as well as their order.

These are proposed mnemonic associations, not alternative translations. A successful test would show that children recall the Gurbani line and can discuss its meaning. Naming a landmark alone is not mastery. An educator should reject imagery that causes a child to infer a meaning the line does not convey.

## Pauri 1 line plan

| Line | Stable place | Intended association | Interpretation boundary |
| --- | --- | --- | --- |
| 1 | Riverside pool | Outward washing and the mind | Water is not shown magically cleansing the mind. Keep the full line and supplied translation beside it. |
| 2 | Quiet grove | External silence and inner stillness | A quiet setting does not imply silence alone achieves inner stillness. |
| 3 | Grain store | Hunger and accumulated worldly goods | Do not reward hoarding or suggest hunger is a moral failure. |
| 4 | Winding maze | Clever strategies and their limits | The maze is a memory cue, not a claim that intelligence is wrong. |
| 5 | Misty threshold | The question of truthful living | The image poses a question. It does not depict a literal spiritual barrier or prescribe a ritual. |
| 6 | Open path | Walking in Hukam | No divine figure, instruction-giving character or simplistic definition of Hukam. Read the full line and meaning. |

Canonical text and English meanings remain in `prototype/src/bani.json`, from the existing BaniDB export. The visual cue copy lives separately in `prototype/src/KidsMode/story.ts`. Never replace scripture with generated text inside an image.

## Visual reference, version 1

Use soft handcrafted 3D storybook illustration, inspired by the selected game map. Rounded tree canopies, earthen terraces, warm ochre paths, turquoise river, sage and wheat greens, soft morning light. Architecture is modest rural Punjab. Use consistent scale and a camera that looks gently down into the place.

Keep the river and path continuous. The pool, tree, grain store, maze and threshold retain their geometry and location in every view. Keep focus areas around the horizontal middle. Background detail supports the landmarks without competing with the Gurbani.

The app shell retains Sundar Gutka navy, original fonts and restrained reading controls. The illustrated world supplies warmth; the text remains easy to read. Prem Singh and Sehaj Kaur remain learner avatars, not narrators who speak as Guru Nanak. No Guru or deity depiction, fabricated historical event, European fantasy castle or unsupported composition-location claim.

The six outer-map nodes represent pauris. The six inner-story stops represent lines of Pauri 1. Keep these labels explicit so children do not confuse the two levels.

## Interaction sequence

1. Enter Kids Mode and choose an explorer. Returning learners keep their selection and progress on that browser.
2. Open the Japji journey and select a pauri.
3. For Pauri 1, choose Walk the story. See the whole place, then explore each landmark with its actual line and meaning.
4. Listen to the reference. Move forward or revisit a place. Practice can use slower reference audio.
5. Turn on Practise from memory. The image remains; the Gurbani is hidden until Reveal the line. This is self-guided recall and does not grant stars.
6. Start a continuous challenge. The scene follows the current line. Feedback appears at the end.
7. Tap a feedback line to practise that line, continue to the next pauri, or use newly earned coins in the wardrobe.
8. Return later and review recent attempts. No lost-streak penalty.

## What behaves like a fuller app

The preview saves progress, selected character, wardrobe, selected pauri, region and display settings in browser storage. It tracks recent challenge attempts, resumes a selected pauri, supports slower audio and recall practice, and provides the next-pauri continuation. Storage is local to this browser and Site origin; it is not an account or device sync.

Team test controls moved into Settings. Automatic sample progression starts at 84% and uses 96% on a later attempt at the same pauri. This deliberately demonstrates improving mastery, the incremental coin award and persistence. It is not an evaluation of learning or speech. Reviewers can disable automatic progression and select another sample result.

The challenge uses no microphone. It advances on a timer and labels the result as sample feedback. Live voice alignment, word-level diagnosis, uploads, accounts and server sync are not implemented. Other bani worlds remain outside the agreed Japji scope.

## Alternatives considered

A different illustration for every line gives more freedom but risks inconsistent landmarks, repeated context switching and a disconnected story. A fully navigable 3D world could provide stronger spatial exploration but would add motion, performance and navigation burdens before the learning approach is validated. The continuous panorama provides stable locations with modest implementation cost and works with React Native image and animation components.

## Review before expanding to all 38 pauris

Ask children to explore with the words visible, then try recalling in order and from a randomly selected landmark. Revisit later, with and without the cues. Check whether they recall the actual line, its place in the pauri, and the supplied meaning. Also test children who prefer audio or find imagery distracting.

An educator should review the associations first. Record confusing cues and replace those before expanding. Keep imagery optional in the production design. Validate text scaling, screen-reader labels, reduced motion and audio interruptions on actual iOS/Android builds.

Future pauris should connect thematically without inventing a chronological story of Guru Nanak composing Japji Sahib. Not every line has a literal physical subject. Recurring themes can reuse a visual motif, while distinct line landmarks preserve local order. Create a reviewed scene plan before generating each pauri's artwork.
