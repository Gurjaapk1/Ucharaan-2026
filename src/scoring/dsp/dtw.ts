/**
 * Dynamic time warping.
 *
 * A child recites more slowly than the ustaad, pauses in different places, and
 * holds some syllables longer. Comparing frame 1 to frame 1 would punish all
 * of that, so DTW finds the best alignment between the two sequences and
 * measures the cost along it — timing differences are absorbed, pronunciation
 * differences are not.
 */

/** Cosine distance in [0, 2]; 0 is identical direction. */
function cosineDistance(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 1;
  return 1 - dot / magnitude;
}

export interface DtwResult {
  /** Accumulated cost divided by path length, so lengths stay comparable. */
  normalisedCost: number;
  pathLength: number;
}

/**
 * Align two feature sequences and return the normalised alignment cost.
 *
 * `band` constrains how far the alignment may drift from the diagonal, as a
 * fraction of the longer sequence. It bounds the work from O(n·m) to a strip,
 * and refuses alignments so skewed they would be meaningless anyway.
 */
export function dtw(
  a: Float32Array[],
  b: Float32Array[],
  band = 0.25,
): DtwResult {
  if (a.length === 0 || b.length === 0) {
    return { normalisedCost: Infinity, pathLength: 0 };
  }

  const rows = a.length;
  const columns = b.length;
  const width = Math.max(
    Math.abs(rows - columns) + 1,
    Math.ceil(band * Math.max(rows, columns)),
  );

  // Two rolling rows of accumulated cost, plus the path length along it.
  let previousCost = new Float64Array(columns + 1).fill(Infinity);
  let previousSteps = new Float64Array(columns + 1);
  let currentCost = new Float64Array(columns + 1);
  let currentSteps = new Float64Array(columns + 1);
  previousCost[0] = 0;

  for (let i = 1; i <= rows; i++) {
    currentCost.fill(Infinity);
    const centre = Math.round((i * columns) / rows);
    const from = Math.max(1, centre - width);
    const to = Math.min(columns, centre + width);

    for (let j = from; j <= to; j++) {
      const cost = cosineDistance(a[i - 1], b[j - 1]);

      // Pick the cheapest of the three predecessors.
      let best = previousCost[j - 1];
      let steps = previousSteps[j - 1];
      if (previousCost[j] < best) {
        best = previousCost[j];
        steps = previousSteps[j];
      }
      if (currentCost[j - 1] < best) {
        best = currentCost[j - 1];
        steps = currentSteps[j - 1];
      }

      currentCost[j] = best + cost;
      currentSteps[j] = steps + 1;
    }

    let swapCost = previousCost;
    previousCost = currentCost;
    currentCost = swapCost;
    let swapSteps = previousSteps;
    previousSteps = currentSteps;
    currentSteps = swapSteps;
  }

  const total = previousCost[columns];
  const steps = previousSteps[columns];
  if (!Number.isFinite(total) || steps === 0) {
    return { normalisedCost: Infinity, pathLength: 0 };
  }
  return { normalisedCost: total / steps, pathLength: steps };
}
