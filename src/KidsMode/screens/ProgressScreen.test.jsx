import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import { setMockState } from "@common/test-utils/mocks/react-redux";

import { dayKey } from "../state/history";

import ProgressScreen from "./ProgressScreen";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: {
      KIDS_PAURI: "Pauri",
      KIDS_OF_THREE_STARS: "of 3 stars",
      KIDS_DAY_IN_A_ROW: "day in a row",
      KIDS_DAYS_IN_A_ROW: "days in a row",
      KIDS_STREAK_START: "Practise today to start a streak.",
      KIDS_NO_WORDS: "No words to practise right now.",
      KIDS_PRACTISE: "Practise",
    },
    StatusBarComponent: () => null,
  });
});
jest.mock("../hooks/useKidsHeader", () => () => null);

const today = dayKey(new Date());

describe("ProgressScreen", () => {
  const navigation = { navigate: jest.fn(), setOptions: jest.fn() };

  beforeEach(() => navigation.navigate.mockClear());

  it("shows stars, the streak and the words to practise", () => {
    setMockState({
      kidsMode: {
        progress: {
          best: { 1: 2 },
          days: [today],
          revisit: { 1: [{ seq: 5, idx: 1, text: "ਸੋਚਿ" }] },
        },
      },
    });
    const { getByText, getByLabelText } = render(<ProgressScreen navigation={navigation} />);
    expect(getByText("1 day in a row")).toBeTruthy();
    expect(getByLabelText("2 of 3 stars")).toBeTruthy();
    expect(getByText("ਸੋਚਿ")).toBeTruthy();
    fireEvent.press(getByText("Practise"));
    expect(navigation.navigate).toHaveBeenCalledWith("KidsPractice", { pauri: 1 });
  });

  it("encourages a new streak and reads progress persisted before history existed", () => {
    setMockState({ kidsMode: { progress: { coins: 20, best: { 1: 2 } } } });
    const { getByText } = render(<ProgressScreen navigation={navigation} />);
    expect(getByText("Practise today to start a streak.")).toBeTruthy();
    expect(getByText("No words to practise right now.")).toBeTruthy();
  });
});
