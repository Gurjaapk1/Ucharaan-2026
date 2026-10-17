/**
 * Where recitations are scored.
 *
 * Expo inlines EXPO_PUBLIC_* variables at bundle time, and only for literal
 * `process.env.EXPO_PUBLIC_X` access, so each one is read by name below.
 */

/** Score on the team's service; false falls back to the on-device MFCC scorer. */
export const USE_SERVICE = true;

export const SCORING_BASE_URL = (
  process.env.EXPO_PUBLIC_SCORING_URL || 'https://SET-ME.example'
).replace(/\/+$/, '');

export const SCORING_API_KEY = process.env.EXPO_PUBLIC_SCORING_API_KEY ?? '';

/** Canned responses without network, so the UI can be exercised before the service is live. */
export const SCORING_MOCK = process.env.EXPO_PUBLIC_SCORING_MOCK === '1';

/** BaniDB bani id for Japji Sahib. */
export const BANI = 2;

/** Used until a reciter picker exists; the manifest lists the others. */
export const DEFAULT_RECITER = 'ggs';

/** BaniDB verse sequence of Pauri 1's first line; 1-4 are the Mool Mantar and opening salok. */
export const FIRST_PAURI_SEQ = 5;

/** The service takes 3-10 s; this leaves room for a cold start before the one retry. */
export const REQUEST_TIMEOUT_MS = 45000;
