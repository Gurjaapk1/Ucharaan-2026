import { Platform } from 'react-native';
/**
 * Where recitations are scored.
 *
 * Expo inlines EXPO_PUBLIC_* variables at bundle time, and only for literal
 * `process.env.EXPO_PUBLIC_X` access, so each one is read by name below.
 */

/** Score on the team's service; false falls back to the on-device MFCC scorer. */
export const USE_SERVICE = true;

/** The placeholder the base URL falls back to when nothing is configured. */
export const SCORING_URL_PLACEHOLDER = 'https://SET-ME.example';

export const SCORING_BASE_URL = (
  Platform.OS === 'web' ? '/api/scoring' : (process.env.EXPO_PUBLIC_SCORING_URL || SCORING_URL_PLACEHOLDER)
).replace(/\/+$/, '');

/**
 * True when no scoring URL was supplied.
 *
 * Worth distinguishing: an unset URL fails exactly like an unreachable server,
 * and reporting it as a network problem sends people looking at the service
 * when the setting was simply never filled in.
 */
export const SCORING_CONFIGURED = SCORING_BASE_URL !== SCORING_URL_PLACEHOLDER;

/** Trace scoring requests to the console. */
export const SCORING_DEBUG = false;

export const SCORING_API_KEY = Platform.OS === 'web' ? '' : (process.env.EXPO_PUBLIC_SCORING_API_KEY ?? '');

/** Canned responses without network, so the UI can be exercised before the service is live. */
export const SCORING_MOCK = process.env.EXPO_PUBLIC_SCORING_MOCK === '1';

/** BaniDB bani id for Japji Sahib. */
export const BANI = 2;

/** Used until a reciter picker exists; the manifest lists the others. */
export const DEFAULT_RECITER = 'bjs';

/** BaniDB verse sequence of Pauri 1's first line; 1-4 are the Mool Mantar and opening salok. */
export const FIRST_PAURI_SEQ = 5;

/** The service takes 3-10 s; this leaves room for a cold start before the one retry. */
export const REQUEST_TIMEOUT_MS = 45000;
