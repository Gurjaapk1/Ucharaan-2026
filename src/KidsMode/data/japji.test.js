import { getPauriLines, isPauriReady, toPauriLine } from "./japji";

const mockRows = [
  {
    Seq: 5,
    GurmukhiUni: "ਸੋਚੈ ਸੋਚਿ ਨ ਹੋਵਈ ॥",
    Transliterations: JSON.stringify({ en: "sochai soch na hoviee ||" }),
  },
];
const mockExecuteSql = jest.fn((_sql, _params, ok) =>
  ok(null, { rows: { length: mockRows.length, item: (i) => mockRows[i] } })
);

jest.mock("../../database/connect", () => ({
  __esModule: true,
  default: () => Promise.resolve({ transaction: (fn) => fn({ executeSql: mockExecuteSql }) }),
}));

describe("japji data", () => {
  it("offers only the pauris the scoring service covers", () => {
    expect(isPauriReady(1)).toBe(true);
    expect(isPauriReady(2)).toBe(false);
  });

  it("reads Pauri 1 as Seq 5-10 and pairs transliteration per word", async () => {
    const lines = await getPauriLines(1, "ENGLISH");
    expect(mockExecuteSql.mock.calls[0][1]).toEqual([2, 5, 10]);
    expect(lines[0].seq).toBe(5);
    expect(lines[0].words[0]).toEqual({ text: "ਸੋਚੈ", translit: "sochai" });
    expect(lines[0].words).toHaveLength(5);
  });

  it("falls back to the line transliteration when word counts differ", () => {
    const line = toPauriLine(
      { Seq: 1, GurmukhiUni: "ਸਤਿ ਨਾਮੁ", Transliterations: JSON.stringify({ en: "satnaam" }) },
      "ENGLISH"
    );
    expect(line.translit).toBe("satnaam");
    expect(line.words.every((word) => word.translit === null)).toBe(true);
  });

  it("returns nothing for a pauri that is not ready", async () => {
    expect(await getPauriLines(2, "ENGLISH")).toEqual([]);
  });
});
