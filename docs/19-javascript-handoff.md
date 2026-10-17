# JavaScript implementation handoff

The reusable feature now uses JavaScript and JSX to match the native team. React Native primitives, StyleSheet, behavior, scripture content, assets and saved-state format are unchanged.

## Reuse

Start with `prototype/src/KidsMode/`. Components use `.jsx`; content, rewards, wardrobe, persistence and feedback functions use `.js`. Type-only declarations were removed. Keep runtime validation in `parseExperience` and `parseWardrobe` when connecting persisted state.

The host object supplies Sheet, Scroll, HorizontalScroll, Icon, image, storage, audio, safeArea and optional statusBarBackground. Sheet receives open, onOpenChange, title and children. Icon receives name, color and optional size. Storage provides load() and save(snapshot). Audio provides playing, error, listen(start, end, rate) and stop(). See NATIVE_INTEGRATION.md for native replacements.

A pauri has number and lines. Each line retains text, transliteration, translation, start and end. Character IDs remain prem and sehaj. Progress retains coins, best stars by pauri, legacy owned/equipped cosmetics and optional wardrobe with owned items, three equipped slots and read stories.

## Keep outside the native app

The browser host `Prototype.jsx`, compatibility shim, web package alias, Sites worker and `src/mobile/` remain preview infrastructure. Protected App.tsx, main.tsx, mobile files and Vite configuration retain TypeScript. TypeScript dependencies check that shell only; the shared feature requires no TypeScript compiler or loader.

Avi and Gurjaap still need to connect navigation, Redux, database text, native audio, recording, live alignment and scoring. This migration does not implement speech recognition or validate a native device build.

## Validation

Production build and all 19 existing domain/worker tests pass. All 28 protected runtime files pass their unchanged integrity check. Domain tests import JavaScript directly with ordinary Node. No dependency was added.
