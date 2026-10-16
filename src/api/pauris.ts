/**
 * Grouping paath lines into pauris.
 *
 * A pauri is a paragraph, as BaniDB's `paragraph` field reports it. One
 * wrinkle: in Jaap Sahib a paragraph is a whole chhand *section* — one of them
 * runs 108 lines across 28 chhands — so a paragraph is additionally split at
 * each closing verse marker (॥੨੮॥). In Japji Sahib no paragraph contains more
 * than one marker, so that split changes nothing there and the grouping is
 * exactly paragraph-per-pauri.
 */

import type { PaathLine } from './bani';

/** ॥<Gurmukhi digits>॥ closing a verse, e.g. ॥੩੮॥ */
const VERSE_MARKER = /॥\s*([੦-੯]+)\s*॥\s*$/;

/** Gurmukhi digits ੦-੯ are contiguous from U+0A66. */
function gurmukhiToInt(digits: string): number {
  let value = 0;
  for (const char of digits) {
    value = value * 10 + (char.codePointAt(0)! - 0x0a66);
  }
  return value;
}

function markerOf(line: PaathLine): number | null {
  const match = VERSE_MARKER.exec(line.gurmukhi.trim());
  return match ? gurmukhiToInt(match[1]) : null;
}

export interface Pauri {
  /** 0-based position in the bani. */
  index: number;
  /** "Pauri 7", or the heading's own text for a heading-only unit. */
  label: string;
  /** The ॥N॥ number closing this unit, when it has one. */
  marker: number | null;
  /** True when the unit is only a heading — still recited, just not a pauri. */
  isHeadingOnly: boolean;
  lines: PaathLine[];
}

/**
 * Split lines into pauris. Lines must be in document order, which is how the
 * API returns them.
 */
export function groupIntoPauris(lines: PaathLine[]): Pauri[] {
  const units: PaathLine[][] = [];
  let current: PaathLine[] = [];
  let currentParagraph: number | null | undefined;

  for (const line of lines) {
    // A new paragraph always starts a new unit.
    if (current.length > 0 && line.paragraph !== currentParagraph) {
      units.push(current);
      current = [];
    }
    currentParagraph = line.paragraph;
    current.push(line);

    // A verse marker closes the unit even mid-paragraph.
    if (markerOf(line) !== null) {
      units.push(current);
      current = [];
      // Keep currentParagraph so the remainder of this paragraph continues
      // into the next unit rather than being treated as a paragraph change.
    }
  }
  if (current.length > 0) units.push(current);

  let pauriNumber = 0;
  return units.map((unitLines, index) => {
    const isHeadingOnly = unitLines.every(line => line.headingLevel !== null);
    if (!isHeadingOnly) pauriNumber += 1;
    return {
      index,
      label: isHeadingOnly
        ? unitLines[0].gurmukhi.trim()
        : `Pauri ${pauriNumber}`,
      marker: markerOf(unitLines[unitLines.length - 1]),
      isHeadingOnly,
      lines: unitLines,
    };
  });
}

/** How a single line was judged. */
export type LineScore = 'good' | 'practise';

export interface PauriResult {
  pauriIndex: number;
  /** Keyed by verseId so a line keeps its mark if the view re-renders. */
  scores: Record<number, LineScore>;
}

/** Share of scored lines marked 'good', 0-1. Null when nothing is scored. */
export function pauriAccuracy(result: PauriResult): number | null {
  const marks = Object.values(result.scores);
  if (marks.length === 0) return null;
  return marks.filter(mark => mark === 'good').length / marks.length;
}
