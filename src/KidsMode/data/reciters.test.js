import { activeWord, lineTimings, reciterOrDefault, reciterTrack } from "./reciters";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({ constant: { AUDIO_BASE_URL: "https://cdn.example/audios" } });
});

describe("reciters", () => {
  it("defaults to Giani Gurdev Singh", () => {
    expect(reciterOrDefault(null)).toBe("ggs");
    expect(reciterOrDefault("bjs")).toBe("bjs");
  });

  it("uses the reader's Japji track", () => {
    expect(reciterTrack("ggs").url).toBe(
      "https://cdn.example/audios/GianiGurdevSingh/JapjiSahib.m4a"
    );
  });

  it("finds bundled line timings by Seq", () => {
    const [first] = lineTimings("ggs", [5]);
    expect(first).toEqual({ start: 34.919, end: 39.891, text: "5" });
  });

  it("estimates the word being recited from the line timing", () => {
    const timings = [
      { start: 10, end: 14 },
      { start: 14, end: 20 },
    ];
    expect(activeWord(timings, [4, 3], 11.5)).toEqual({ line: 0, word: 1 });
    expect(activeWord(timings, [4, 3], 19.9)).toEqual({ line: 1, word: 2 });
    expect(activeWord(timings, [4, 3], 25)).toBeNull();
  });
});
