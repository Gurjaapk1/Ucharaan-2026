export function starsForScore(score) {
    if (!Number.isFinite(score) || score < 0 || score > 100)
        throw new Error('Score must be between 0 and 100');
    return score >= 95 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
}
export function coinAward(previous, next) {
    return Math.max(0, next - previous) * 10;
}
export const initialProgress = { coins: 0, best: {}, owned: ['classic', 'sky'], equipped: 'classic' };
export function completePauri(progress, pauri, score) {
    const next = starsForScore(score);
    const previous = progress.best[String(pauri)] ?? 0;
    return { ...progress, coins: progress.coins + coinAward(previous, next), best: { ...progress.best, [pauri]: next > previous ? next : previous } };
}
export function redeem(progress, item, cost) {
    if (progress.owned.includes(item))
        return { ...progress, equipped: item };
    if (!Number.isInteger(cost) || cost < 0 || progress.coins < cost)
        return progress;
    return { ...progress, coins: progress.coins - cost, owned: [...progress.owned, item], equipped: item };
}
