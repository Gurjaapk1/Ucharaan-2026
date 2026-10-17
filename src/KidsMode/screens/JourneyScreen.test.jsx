import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import { setMockState } from "@common/test-utils/mocks/react-redux";

import JourneyScreen from "./JourneyScreen";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: {
      KIDS_PAURI: "Pauri",
      KIDS_OF_THREE_STARS: "of 3 stars",
      KIDS_COMING_SOON: "Coming soon",
      KIDS_COINS: "Nanak coins",
    },
    StatusBarComponent: () => null,
  });
});
jest.mock("../hooks/useKidsHeader", () => () => null);

describe("JourneyScreen", () => {
  const navigation = { navigate: jest.fn(), setOptions: jest.fn() };

  beforeEach(() => {
    setMockState({ kidsMode: { progress: { coins: 20, best: { 1: 2 } } } });
    navigation.navigate.mockClear();
  });

  it("shows best stars and coins", () => {
    const { getByLabelText, getByText } = render(<JourneyScreen navigation={navigation} />);
    expect(getByLabelText("Pauri 1, 2 of 3 stars")).toBeTruthy();
    expect(getByText("★ 2/114 · 20 Nanak coins")).toBeTruthy();
  });

  it("opens practice for a ready pauri", () => {
    const { getByLabelText } = render(<JourneyScreen navigation={navigation} />);
    fireEvent.press(getByLabelText("Pauri 1, 2 of 3 stars"));
    expect(navigation.navigate).toHaveBeenCalledWith("KidsPractice", { pauri: 1 });
  });

  it("marks pauris the service does not cover as coming soon", () => {
    const { getByLabelText } = render(<JourneyScreen navigation={navigation} />);
    fireEvent.press(getByLabelText("Pauri 2, Coming soon"));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
