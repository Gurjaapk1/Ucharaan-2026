import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import { setMockState } from "@common/test-utils/mocks/react-redux";

import KidsHomeScreen from "./KidsHomeScreen";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: {
      KIDS_HOME_HEADING: "Your bani journey",
      KIDS_STARS: "stars",
      KIDS_COINS: "Nanak coins",
      KIDS_OPEN_JOURNEY: "Open my journey",
    },
    StatusBarComponent: () => null,
  });
});
jest.mock("../hooks/useKidsHeader", () => () => null);

describe("KidsHomeScreen", () => {
  it("shows stars and coins and opens the journey", () => {
    setMockState({ kidsMode: { progress: { coins: 20, best: { 1: 2 } } } });
    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    const { getByText } = render(<KidsHomeScreen navigation={navigation} />);
    expect(getByText("Your bani journey")).toBeTruthy();
    expect(getByText("2 stars · 20 Nanak coins")).toBeTruthy();
    fireEvent.press(getByText("Open my journey"));
    expect(navigation.navigate).toHaveBeenCalledWith("KidsJourney");
  });
});
