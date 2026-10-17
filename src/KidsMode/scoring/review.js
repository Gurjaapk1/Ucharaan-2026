import { referenceUrl } from "./client";

// Used when the manifest is unavailable; the same thresholds as the Uchaaran prototype.
export const DEFAULT_STAR_BANDS = [60, 80, 95];

export const starsFor = (percent, bands = DEFAULT_STAR_BANDS) =>
  bands.filter((band) => percent >= band).length;

// The contract says 0-1; an already-scaled percent is accepted too.
const toPercent = (value) =>
  Number.isFinite(value)
    ? Math.round(Math.max(0, Math.min(100, value <= 1 ? value * 100 : value)))
    : 0;

// Service idx -> on-screen word, matched by Gurmukhi in order, so a different split of the
// line cannot shift every verdict; unmatched words keep their idx.
const wordIndexMap = (words, reference) => {
  const map = new Map();
  let from = 0;
  (reference?.words ?? []).forEach(({ idx, gurmukhi }) => {
    const at = words.findIndex((word, i) => i >= from && word.text === gurmukhi);
    if (at >= 0) {
      map.set(idx, at);
      from = at + 1;
    }
  });
  return (idx) => map.get(idx) ?? idx;
};

// Builds what the results screen shows from the pauri's lines, the service's verdicts and the manifest.
export const toReview = (lines, response, manifest, reciter) => {
  const bands = manifest?.star_bands ?? DEFAULT_STAR_BANDS;
  let focus = null;
  const reviewed = lines.map((line, lineIndex) => {
    const scored = (response.lines ?? []).find((l) => Number(l.seq) === line.seq);
    const reference = manifest?.lines?.[reciter]?.[String(line.seq)];
    const toScreen = wordIndexMap(line.words, reference);
    const states = new Map((scored?.words ?? []).map((w) => [toScreen(w.idx), w.state]));
    const clips = new Map(
      (reference?.words ?? []).map((w) => [toScreen(w.idx), referenceUrl(w.clip_url)])
    );
    if (response.focus && Number(response.focus.seq) === line.seq) {
      focus = { line: lineIndex, word: toScreen(response.focus.idx) };
    }
    const score = toPercent(scored?.share_like ?? scored?.share_like_reciter);
    return {
      seq: line.seq,
      score,
      stars: starsFor(score, bands),
      words: line.words.map((word, i) => ({
        text: word.text,
        state: states.get(i) ?? null,
        clip: clips.get(i) ?? null,
      })),
    };
  });
  const score = reviewed.length
    ? Math.round(reviewed.reduce((sum, line) => sum + line.score, 0) / reviewed.length)
    : 0;
  return { lines: reviewed, score, stars: starsFor(score, bands), focus };
};
