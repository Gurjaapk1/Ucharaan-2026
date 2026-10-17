import { bestStars, coinAward, recordResult, totalCoins, totalStars } from "./progress";

describe("Kids Mode progress", () => {
  it("reads progress persisted before best and coins existed", () => {
    expect(bestStars({}, 1)).toBe(0);
    expect(totalCoins({})).toBe(0);
    expect(totalStars(undefined)).toBe(0);
  });

  it("awards 10 coins per new star", () => {
    expect(coinAward(1, 3)).toBe(20);
    expect(coinAward(3, 1)).toBe(0);
  });

  it("keeps the best stars and awards coins once", () => {
    const first = recordResult({}, 1, 2);
    expect(first).toEqual({ coins: 20, best: { 1: 2 } });
    expect(recordResult(first, 1, 2)).toEqual(first);
    expect(recordResult(first, 1, 1)).toEqual(first);
    expect(recordResult(first, 1, 3)).toEqual({ coins: 30, best: { 1: 3 } });
  });

  it("totals stars across pauris", () => {
    expect(totalStars({ best: { 1: 2, 2: 3 } })).toBe(5);
  });
});
