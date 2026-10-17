import { recordResult } from "./progress";

// Attempts kept for the parent summary; stars, coins, revisit words and practice days are kept
// separately, so trimming history never takes anything the child earned.
export const HISTORY_LIMIT = 50;
export const RECORDINGS_PER_PAURI = 3;
export const JAPJI_PAURIS = 38;

const pad = (n) => String(n).padStart(2, "0");

// Local calendar day, so a streak follows the child's day rather than UTC midnight.
export const dayKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const previousDay = (day) => {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

// Words marked check, the ones the child is asked to revisit, from a reviewed result.
export const checkWords = (result) =>
  result.lines.flatMap((line) =>
    line.words.flatMap((word, idx) =>
      word.state === "check" ? [{ seq: line.seq, idx, text: word.text }] : []
    )
  );

export const toAttempt = (pauri, result, date) => ({
  pauri,
  stars: result.stars,
  date: date.toISOString(),
  day: dayKey(date),
  lines: result.lines.map((line) => ({ seq: line.seq, share: line.score })),
  focus: checkWords(result),
});

export const addAttempt = (progress, { pauri, stars, date, day, lines, focus }) => {
  const days = progress.days ?? [];
  return {
    ...progress,
    ...recordResult(progress, pauri, stars),
    history: [...(progress.history ?? []), { date, pauri, stars, lines, focus }].slice(
      -HISTORY_LIMIT
    ),
    revisit: { ...progress.revisit, [pauri]: focus },
    days: days.includes(day) ? days : [...days, day],
  };
};

// Consecutive practice days ending today, or yesterday while today is still open.
// A missed day resets this count only; stars and coins are untouched.
export const currentStreak = (progress, today) => {
  const days = new Set(progress?.days ?? []);
  let cursor = days.has(today) ? today : previousDay(today);
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = previousDay(cursor);
  }
  return count;
};

export const practiceDays = (progress) => progress?.days ?? [];

// Practised: any checked attempt. Completed: at least one star, as on the journey map.
export const pauriCounts = (progress) => {
  const best = Object.values(progress?.best ?? {});
  return { practised: best.length, completed: best.filter((stars) => stars > 0).length };
};

export const isJapjiComplete = (progress) => pauriCounts(progress).completed >= JAPJI_PAURIS;

export const wordsToRevisit = (progress) =>
  Object.entries(progress?.revisit ?? {})
    .filter(([, words]) => words.length > 0)
    .map(([pauri, words]) => ({ pauri: Number(pauri), words }));

// Shown only when the kept history has two attempts of a pauri and the latest earned more stars
// than the earliest; one good attempt is never reported as improvement.
export const improvements = (progress) => {
  const byPauri = new Map();
  (progress?.history ?? []).forEach((attempt) => {
    byPauri.set(attempt.pauri, [...(byPauri.get(attempt.pauri) ?? []), attempt]);
  });
  return [...byPauri.entries()]
    .filter(([, attempts]) => attempts.length >= 2)
    .map(([pauri, attempts]) => ({
      pauri,
      from: attempts[0].stars,
      to: attempts[attempts.length - 1].stars,
      attempts: attempts.length,
    }))
    .filter(({ from, to }) => to > from);
};

// Keeps the latest recordings of each pauri; recordings are stored oldest first.
export const keepLatest = (recordings, limit = RECORDINGS_PER_PAURI) => {
  const seen = {};
  return recordings
    .slice()
    .reverse()
    .filter(({ pauri }) => {
      seen[pauri] = (seen[pauri] ?? 0) + 1;
      return seen[pauri] <= limit;
    })
    .reverse();
};
