import { renderHook, waitFor } from "@testing-library/react-native";
import { setMockState } from "@common/test-utils/mocks/react-redux";
import { getPauriLines } from "../data/japji";
import usePauriLines from "./usePauriLines";

jest.mock("../data/japji", () => ({ getPauriLines: jest.fn() }));

describe("usePauriLines", () => {
  it("loads the pauri in the chosen transliteration language", async () => {
    setMockState({ transliterationLanguage: "HINDI" });
    getPauriLines.mockResolvedValue([{ seq: 5, translit: "", words: [] }]);
    const { result } = renderHook(() => usePauriLines(1));
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(getPauriLines).toHaveBeenCalledWith(1, "HINDI");
  });
});
