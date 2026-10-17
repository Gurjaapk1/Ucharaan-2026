import { starsFor, toReview } from "./review";

jest.mock("./client", () => ({
  referenceUrl: (path) => `https://score.example/reference/${path}`,
}));

const lines = [
  { seq: 5, words: [{ text: "ਸੋਚੈ" }, { text: "ਸੋਚਿ" }, { text: "॥" }] },
  { seq: 6, words: [{ text: "ਚੁਪੈ" }, { text: "ਚੁਪ" }] },
];
const response = {
  status: "ok",
  lines: [
    {
      seq: 5,
      share_like: 0.5,
      words: [
        { idx: 0, state: "like" },
        { idx: 1, state: "check" },
      ],
    },
    {
      seq: 6,
      share_like: 1,
      words: [
        { idx: 0, state: "like" },
        { idx: 1, state: "unclear" },
      ],
    },
  ],
  focus: { seq: 5, idx: 1 },
};
const manifest = {
  star_bands: [50, 75, 90],
  lines: {
    ggs: {
      5: {
        words: [
          { idx: 0, gurmukhi: "ਸੋਚੈ", clip_url: "ggs/5/words/0.wav" },
          { idx: 1, gurmukhi: "ਸੋਚਿ", clip_url: "ggs/5/words/1.wav" },
        ],
      },
    },
  },
};

describe("toReview", () => {
  it("puts each verdict, clip and line star on the right word", () => {
    const review = toReview(lines, response, manifest, "ggs");
    expect(review.lines[0].words[1]).toEqual({
      text: "ਸੋਚਿ",
      state: "check",
      clip: "https://score.example/reference/ggs/5/words/1.wav",
    });
    expect(review.lines[0].words[2].state).toBeNull();
    expect(review.lines.map((line) => [line.score, line.stars])).toEqual([
      [50, 1],
      [100, 3],
    ]);
    expect(review.score).toBe(75);
    expect(review.stars).toBe(2);
    expect(review.focus).toEqual({ line: 0, word: 1 });
  });

  it("matches service words by Gurmukhi when the split differs", () => {
    const shifted = {
      ...manifest,
      lines: { ggs: { 5: { words: [{ idx: 0, gurmukhi: "ਸੋਚਿ", clip_url: "c.wav" }] } } },
    };
    const review = toReview(
      lines,
      { ...response, lines: [{ seq: 5, share_like: 1, words: [{ idx: 0, state: "check" }] }] },
      shifted,
      "ggs"
    );
    expect(review.lines[0].words[1].state).toBe("check");
    expect(review.lines[0].words[0].state).toBeNull();
  });

  it("falls back to default star bands without a manifest", () => {
    expect(starsFor(80)).toBe(2);
    expect(toReview(lines, response, null, "ggs").lines[0].clip).toBeUndefined();
  });
});
