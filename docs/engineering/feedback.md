# Response to organizer feedback

The organizers asked whether line-by-line recitation would reduce pressure compared with a whole pauri, whether feedback could be simpler, and how Khalis would maintain and update the ML library.

| Feedback | Current response | Where to inspect |
| --- | --- | --- |
| Test accuracy line by line | Record and score one line at a time. Retry preserves earlier completed lines. | `src/host/recordedRecitation.ts` and `src/KidsMode/KidsApp.tsx` under `native-app/` |
| Feedback is too verbose | Use short prompts and three word states. Let the child listen and retry a particular word or line. | `native-app/src/KidsMode/WordReview.tsx` |
| Khalis needs model and maintenance documentation | Added the model production guide, API contract, privacy lifecycle, validation steps, and update/rollback procedure. | `docs/engineering/` |

The line-by-line flow is implemented. It is not evidence that pronunciation accuracy has improved: that requires an ustaad-labeled evaluation set with children's voices and ordinary phone microphones. Likewise, reduced pressure and clearer feedback are design goals until observed with learners.

Retained product decisions: six region panels, Gurmukhi plus pronunciation plus meaning, phrase-based recall choices, passage-focused image explanations, and rewards earned through learning. No full-pauri automatic speech-following claim is made for the current challenge.
