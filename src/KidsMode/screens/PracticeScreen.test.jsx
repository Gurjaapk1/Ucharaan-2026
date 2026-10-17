import React from "react";
import { View } from "react-native";

import { fireEvent, render, within } from "@testing-library/react-native";

import { getMockDispatch, setMockState } from "@common/test-utils/mocks/react-redux";

import useKidsAudio from "../hooks/useKidsAudio";
import { setKidsReciter } from "../state/actions";

import PracticeScreen from "./PracticeScreen";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: { KIDS_LISTEN: "Listen", KIDS_PAUSE: "Pause" },
    constant: { AUDIO_BASE_URL: "https://cdn.example/audios" },
    StatusBarComponent: () => null,
  });
});
jest.mock("@common/hooks/useThemedStyles", () => ({
  __esModule: true,
  default: () => ({ wordActive: { backgroundColor: "highlight" } }),
}));
jest.mock("../hooks/useKidsHeader", () => () => null);
jest.mock("../hooks/usePauriLines", () => () => [
  {
    seq: 5,
    translit: "sochai soch",
    words: [
      { text: "ਸੋਚੈ", translit: "sochai" },
      { text: "ਸੋਚਿ", translit: "soch" },
    ],
  },
]);
jest.mock("../hooks/useKidsAudio", () => jest.fn());

const renderPractice = () =>
  render(
    <PracticeScreen navigation={{ setOptions: jest.fn() }} route={{ params: { pauri: 1 } }} />
  );

describe("PracticeScreen", () => {
  const audio = { playing: false, position: 0, play: jest.fn(), stop: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    useKidsAudio.mockReturnValue(audio);
    setMockState({ isTransliteration: false, kidsMode: { reciter: null } });
  });

  it("renders each word, with transliteration only when the setting is on", () => {
    const off = renderPractice();
    expect(off.getByText("ਸੋਚੈ")).toBeTruthy();
    expect(off.queryByText("sochai")).toBeNull();
    setMockState({ isTransliteration: true });
    expect(renderPractice().getByText("sochai")).toBeTruthy();
  });

  it("plays the pauri from the reciter's bundled line timings", () => {
    const { getByText } = renderPractice();
    fireEvent.press(getByText("Listen"));
    expect(audio.play).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://cdn.example/audios/GianiGurdevSingh/JapjiSahib.m4a",
      }),
      34.919,
      39.891
    );
  });

  it("highlights the word at the playback position", () => {
    useKidsAudio.mockReturnValue({ ...audio, playing: true, position: 38 });
    const screen = renderPractice();
    expect(screen.getByText("Pause")).toBeTruthy();
    // Seq 5 runs 34.919-39.891 for ggs, so 38 s falls on the second of two words.
    const highlighted = screen
      .UNSAFE_getAllByType(View)
      .filter((view) =>
        [view.props.style].flat().some((style) => style?.backgroundColor === "highlight")
      );
    expect(highlighted).toHaveLength(1);
    expect(within(highlighted[0]).getByText("ਸੋਚਿ")).toBeTruthy();
  });

  it("switches reciter", () => {
    const { getByText } = renderPractice();
    fireEvent.press(getByText("Bhai Jarnail Singh"));
    expect(audio.stop).toHaveBeenCalled();
    expect(getMockDispatch()).toHaveBeenCalledWith(setKidsReciter("bjs"));
  });
});
