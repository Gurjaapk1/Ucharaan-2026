import type {Wardrobe} from './wardrobe';
export type Stars = 0 | 1 | 2 | 3;
export function starsForScore(score: number): Stars {
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error('Score must be between 0 and 100');
  return score >= 95 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
}
export function coinAward(previous: Stars, next: Stars): number {
  return Math.max(0, next - previous) * 10;
}
export type Progress = { coins: number; best: Record<string, Stars>; owned: string[]; equipped: string; wardrobe?:Wardrobe };
export const initialProgress: Progress = {coins:0,best:{},owned:['classic','sky'],equipped:'classic'};
export function completePauri(progress: Progress, pauri: number, score: number): Progress {
  const next = starsForScore(score);
  const previous = progress.best[String(pauri)] ?? 0;
  return {...progress, coins: progress.coins + coinAward(previous,next), best:{...progress.best,[pauri]:next > previous ? next : previous}};
}
export function redeem(progress: Progress, item: string, cost: number): Progress {
  if (progress.owned.includes(item)) return {...progress,equipped:item};
  if (!Number.isInteger(cost) || cost < 0 || progress.coins < cost) return progress;
  return {...progress, coins:progress.coins-cost,owned:[...progress.owned,item],equipped:item};
}
