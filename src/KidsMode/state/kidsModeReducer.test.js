import { recordKidsResult, setKidsReciter, setKidsScoringOptIn, toggleKidsMode } from "./actions";
import kidsMode from "./kidsModeReducer";

describe("kidsMode reducer", () => {
  const initial = kidsMode(undefined, { type: "@@INIT" });

  it("starts off, without consent to send audio", () => {
    expect(initial).toEqual({
      enabled: false,
      scoringOptIn: false,
      reciter: null,
      progress: { coins: 0, best: {} },
    });
  });

  it("toggles Kids Mode", () => {
    expect(kidsMode(initial, toggleKidsMode(true)).enabled).toBe(true);
  });

  it("records the online pronunciation check opt-in", () => {
    expect(kidsMode(initial, setKidsScoringOptIn(true)).scoringOptIn).toBe(true);
  });

  it("sets the reciter", () => {
    expect(kidsMode(initial, setKidsReciter("bhai-example")).reciter).toBe("bhai-example");
  });

  it("records a result once, even on state persisted without best or coins", () => {
    const old = { ...initial, progress: {} };
    const once = kidsMode(old, recordKidsResult(1, 2));
    expect(once.progress).toEqual({ coins: 20, best: { 1: 2 } });
    expect(kidsMode(once, recordKidsResult(1, 2)).progress).toEqual(once.progress);
  });
});
