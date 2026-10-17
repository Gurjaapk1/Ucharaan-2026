import React from "react";

import { fireEvent, render, within } from "@testing-library/react-native";

import useKidsAudio from "../hooks/useKidsAudio";

import ResultsScreen from "./ResultsScreen";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: {
      KIDS_COINS: "Nanak coins",
      KIDS_BEST_KEPT: "Best score kept",
      KIDS_WORDS_TO_CHECK: "words to check",
      KIDS_NOT_DETECTED: "Extra or skipped speech may not be detected",
      KIDS_PRACTISE_WORD: "Practise this word",
      KIDS_HEAR_RECITER: "Hear the reciter say",
      KIDS_LINE: "Line",
      KIDS_TRY_AGAIN: "Try again",
    },
    StatusBarComponent: () => null,
  });
});
jest.mock("@common/hooks/useThemedStyles", () => ({
  __esModule: true,
  default: () => ({ wordCheck: { color: "check" }, wordUnclear: { color: "unclear" } }),
}));
jest.mock("../hooks/useKidsHeader", () => () => null);
jest.mock("../hooks/useKidsAudio", () => jest.fn());

const CLIP = "https://score.example/reference/ggs/5/words/1.wav";
const result = {
  score: 85,
  stars: 2,
  focus: { line: 0, word: 1 },
  lines: [
    {
      seq: 5,
      score: 85,
      stars: 2,
      words: [
        { text: "ਸੋਚੈ", state: "like", clip: null },
        { text: "ਸੋਚਿ", state: "check", clip: CLIP },
        { text: "ਨ", state: "unclear", clip: null },
      ],
    },
  ],
};

const navigation = { navigate: jest.fn(), replace: jest.fn(), setOptions: jest.fn() };
const renderResults = (award) =>
  render(<ResultsScreen navigation={navigation} route={{ params: { pauri: 1, result, award } }} />);
const colorOf = (node) => Object.assign({}, ...[node.props.style].flat(Infinity)).color;

describe("ResultsScreen", () => {
  const play = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useKidsAudio.mockReturnValue({ play });
  });

  it("shows coins for a new star and keeps the best otherwise", () => {
    expect(renderResults(20).getByText("+20 Nanak coins")).toBeTruthy();
    expect(renderResults(0).getByText("Best score kept")).toBeTruthy();
  });

  it("marks each word with its state and counts the words to check", () => {
    const view = renderResults(0);
    expect(view.getByText("1 words to check")).toBeTruthy();
    expect(view.getByText("Extra or skipped speech may not be detected")).toBeTruthy();
    expect(colorOf(view.getByText("ਸੋਚੈ"))).toBeUndefined();
    expect(colorOf(view.getByText("ਨ"))).toBe("unclear");
    // The focus word appears in the practise box and again in its line.
    expect(view.getAllByText("ਸੋਚਿ").map(colorOf)).toContain("check");
  });

  it("offers the focus word for practice and plays the reciter's clip of it", () => {
    const view = renderResults(0);
    expect(view.getAllByText("ਸੋਚਿ")).toHaveLength(2);
    fireEvent.press(view.getByText("Hear the reciter say ਸੋਚਿ"));
    expect(play).toHaveBeenCalledWith({ id: CLIP, url: CLIP, title: "ਸੋਚਿ" });
    const practise = view
      .getAllByRole("button")
      .find((button) => within(button).queryByText("Practise this word"));
    fireEvent.press(practise);
    expect(navigation.navigate).toHaveBeenCalledWith("KidsPractice", { pauri: 1 });
  });

  it("tries the challenge again in place of the results", () => {
    fireEvent.press(renderResults(0).getByText("Try again"));
    expect(navigation.replace).toHaveBeenCalledWith("KidsChallenge", { pauri: 1 });
  });
});
