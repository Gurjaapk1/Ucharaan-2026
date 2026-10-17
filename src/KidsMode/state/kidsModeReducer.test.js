import { REHYDRATE } from "redux-persist";
import { recordKidsResult, setKidsReciter, setKidsScoringOptIn, toggleKidsMode } from "./actions";
import kidsMode from "./kidsModeReducer";
import { attemptRecorded, recordingDeleted, recordingSaved } from "./progressActions";

jest.mock("@common", () => ({ logError: jest.fn() }));

describe("kidsMode reducer", () => {
  const initial = kidsMode(undefined, { type: "@@INIT" });

  it("starts off, without consent to send audio", () => {
    expect(initial).toEqual({
      enabled: false,
      scoringOptIn: false,
      reciter: null,
      progress: { coins: 0, best: {}, history: [], revisit: {}, days: [] },
      recordings: [],
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
    expect(once.progress).toEqual({ ...initial.progress, coins: 20, best: { 1: 2 } });
    expect(kidsMode(once, recordKidsResult(1, 2)).progress).toEqual(once.progress);
  });

  it("fills keys added since the slice was persisted when it is rehydrated", () => {
    const persisted = {
      enabled: true,
      scoringOptIn: true,
      progress: { coins: 20, best: { 1: 2 } },
    };
    const rehydrated = kidsMode(initial, { type: REHYDRATE, payload: { kidsMode: persisted } });
    expect(rehydrated).toEqual({
      ...initial,
      enabled: true,
      scoringOptIn: true,
      progress: { ...initial.progress, coins: 20, best: { 1: 2 } },
    });
    expect(kidsMode(initial, { type: REHYDRATE, payload: {} })).toBe(initial);
  });

  it("returns complete state unchanged for other actions", () => {
    expect(kidsMode(initial, { type: "OTHER" })).toBe(initial);
  });

  it("records an attempt and keeps its recording", () => {
    const attempt = { pauri: 1, stars: 1, date: "d", day: "2026-10-16", lines: [], focus: [] };
    const state = kidsMode(initial, attemptRecorded(attempt));
    expect(state.progress.coins).toBe(10);
    expect(state.progress.days).toEqual(["2026-10-16"]);
    const saved = kidsMode(state, recordingSaved({ path: "kids/a.m4a", pauri: 1, date: "d" }));
    expect(saved.recordings).toHaveLength(1);
    expect(kidsMode(saved, recordingDeleted("kids/a.m4a")).recordings).toEqual([]);
  });
});
