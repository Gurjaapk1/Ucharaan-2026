import {
  addAttempt,
  checkWords,
  currentStreak,
  dayKey,
  HISTORY_LIMIT,
  improvements,
  isJapjiComplete,
  keepLatest,
  pauriCounts,
  toAttempt,
  wordsToRevisit,
} from "./history";

const result = {
  stars: 2,
  score: 85,
  lines: [
    {
      seq: 5,
      score: 90,
      words: [
        { text: "ਸੋਚੈ", state: "like" },
        { text: "ਸੋਚਿ", state: "check" },
      ],
    },
    { seq: 6, score: 80, words: [{ text: "ਨ", state: null }] },
  ],
};

const attempt = (pauri, stars, day, focus = []) => ({
  pauri,
  stars,
  day,
  date: `${day}T10:00:00.000Z`,
  lines: [],
  focus,
});

describe("Kids Mode history", () => {
  it("uses the local calendar day", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });

  it("keeps the date, per-line share and words marked check of an attempt", () => {
    const date = new Date(2026, 9, 16, 12);
    expect(toAttempt(1, result, date)).toEqual({
      pauri: 1,
      stars: 2,
      date: date.toISOString(),
      day: "2026-10-16",
      lines: [
        { seq: 5, share: 90 },
        { seq: 6, share: 80 },
      ],
      focus: [{ seq: 5, idx: 1, text: "ਸੋਚਿ" }],
    });
    expect(checkWords({ lines: [] })).toEqual([]);
  });

  it("adds an attempt to progress persisted before history existed", () => {
    const focus = [{ seq: 5, idx: 1, text: "ਸੋਚਿ" }];
    const next = addAttempt({}, attempt(1, 2, "2026-10-16", focus));
    expect(next.coins).toBe(20);
    expect(next.best).toEqual({ 1: 2 });
    expect(next.history).toHaveLength(1);
    expect(next.revisit).toEqual({ 1: focus });
    expect(next.days).toEqual(["2026-10-16"]);
  });

  it("replaces revisit words with the latest attempt and counts a day once", () => {
    let progress = addAttempt({}, attempt(1, 1, "2026-10-16", [{ seq: 5, idx: 0, text: "a" }]));
    progress = addAttempt(progress, attempt(1, 3, "2026-10-16"));
    expect(progress.revisit).toEqual({ 1: [] });
    expect(progress.days).toEqual(["2026-10-16"]);
    expect(wordsToRevisit(progress)).toEqual([]);
  });

  it("keeps only the latest attempts, never the stars", () => {
    let progress = addAttempt({}, attempt(1, 3, "2026-01-01"));
    for (let i = 0; i < HISTORY_LIMIT; i += 1) {
      progress = addAttempt(progress, attempt(1, 0, "2026-01-02"));
    }
    expect(progress.history).toHaveLength(HISTORY_LIMIT);
    expect(progress.best).toEqual({ 1: 3 });
    expect(progress.days).toEqual(["2026-01-01", "2026-01-02"]);
  });

  it("counts consecutive practice days and resets after a missed day", () => {
    const progress = { days: ["2026-09-29", "2026-09-30", "2026-10-01"] };
    expect(currentStreak(progress, "2026-10-01")).toBe(3);
    expect(currentStreak(progress, "2026-10-02")).toBe(3);
    expect(currentStreak(progress, "2026-10-03")).toBe(0);
    expect(currentStreak(undefined, "2026-10-03")).toBe(0);
  });

  it("keeps practised, completed and bani completion apart", () => {
    const progress = { best: { 1: 2, 2: 0 } };
    expect(pauriCounts(progress)).toEqual({ practised: 2, completed: 1 });
    expect(isJapjiComplete(progress)).toBe(false);
    const all = Object.fromEntries(Array.from({ length: 38 }, (_, i) => [i + 1, 1]));
    expect(isJapjiComplete({ best: all })).toBe(true);
  });

  it("reports improvement only across two attempts with more stars", () => {
    expect(improvements({ history: [attempt(1, 3, "2026-10-16")] })).toEqual([]);
    expect(
      improvements({ history: [attempt(1, 2, "2026-10-15"), attempt(1, 1, "2026-10-16")] })
    ).toEqual([]);
    const history = [
      attempt(1, 1, "2026-10-14"),
      attempt(1, 1, "2026-10-15"),
      attempt(1, 3, "2026-10-16"),
    ];
    expect(improvements({ history })).toEqual([{ pauri: 1, from: 1, to: 3, attempts: 3 }]);
  });

  it("keeps the latest three recordings of each pauri", () => {
    const recordings = ["a", "b", "c", "d"].map((path) => ({ path, pauri: 1 }));
    expect(keepLatest([{ path: "x", pauri: 2 }, ...recordings]).map((r) => r.path)).toEqual([
      "x",
      "b",
      "c",
      "d",
    ]);
  });
});
