// Reads tolerate a kidsMode slice persisted before progress had these fields.
export const COINS_PER_STAR = 10;

export const bestStars = (progress, pauri) => progress?.best?.[pauri] ?? 0;

export const totalStars = (progress) =>
  Object.values(progress?.best ?? {}).reduce((sum, stars) => sum + stars, 0);

export const totalCoins = (progress) => progress?.coins ?? 0;

export const coinAward = (previous, next) => Math.max(0, next - previous) * COINS_PER_STAR;

// Only a new star earns coins, so recording the same result twice changes nothing.
export const recordResult = (progress, pauri, stars) => {
  const previous = bestStars(progress, pauri);
  return {
    coins: totalCoins(progress) + coinAward(previous, stars),
    best: { ...progress?.best, [pauri]: Math.max(previous, stars) },
  };
};
