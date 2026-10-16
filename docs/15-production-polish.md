# Quieter visuals and production polish

The user requested simpler imagery, clearer text and a closer approximation of a production app. This revision preserves the Pauri 1 memory walk, the journey and rewards. It changes their presentation, not the learning or scoring claims.

## What changed

The map and panorama now use broad painted shapes, open space and a muted palette. Tiny foliage, stones, crops and decorative scenery were removed. The six memory landmarks retain their order. A closer view emphasizes the current landmark.

Each reading screen shows one image. The whole-path view and explanation of the picture are optional. Gurbani and the supplied English translation remain unchanged. The interface no longer repeats motivational slogans or explains implementation decisions during reading.

Listen, previous line and next line stay in a fixed bottom bar. The verse scrolls separately when more room is needed. Practice has one expandable line picker and a compact playback-speed control. English meanings use 16-point text with 26-point line height. Secondary text uses 14 points. Story selectors and region controls have at least 44-point touch targets.

Settings includes Illustrations. Turning it off removes the supporting image from story, practice and challenge screens. The map remains a navigation view. This preference persists without resetting previously saved rewards. The story's explanatory text remains available as a memory aid, but is not a replacement for the verse or its meaning.

## Visual rules for later work

- Keep the connected route and stable landmarks, with one focal object per reading view.
- Use large silhouettes and restrained shading. Avoid decorative detail that disappears at phone size.
- Keep all scripture and translations as real text outside images.
- Keep Sundar Gutka's navy and typography in the interface. Use the warmer palette only for illustrations.
- Show one primary action. Put additional explanations behind clearly named controls.
- Use literal labels such as Your rewards, Challenge complete and Listen. Do not replace useful information with slogans.
- Preserve optional imagery, text scaling, reduced motion and audio access in the native build.

The exported JPEGs are about 348 KB for the panorama and 478 KB for the map. The original generated files remain available as source artwork. Earlier detailed assets remain in the repository as references, but the revised screens no longer load them. Other map regions reuse the calmer map temporarily; they do not have unique finalized geography. Only Pauri 1 has reviewed-in-app line imagery.

## Screen review

1. Story. Previously, two pictures and introductory copy pushed the verse down. Now one picture, the verse, its meaning and fixed controls fit at the default size. The whole route is optional.
2. Practice. Previously, small helper copy and duplicated line navigation competed with reading. Now a single expandable picker, larger meaning text and fixed controls keep the main task clear.
3. Journey. Previously, dense scenery competed with the numbered nodes and stars. The simplified terrain keeps those controls distinct. The route remains scrollable on smaller previews.

Screenshots and verification are in [the polish QA report](../prototype/design-qa-polish.md).

## Remaining production work

The preview still simulates voice alignment and pronunciation scores. Real assessment, native builds, device accessibility testing and educator review remain separate work. Browser screenshots do not establish accessibility compliance or that the imagery improves recall. The native team should use its existing navigation, persisted Redux state, audio and safe-area infrastructure through the documented adapters.
