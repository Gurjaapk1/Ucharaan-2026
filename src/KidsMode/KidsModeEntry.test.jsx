import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import { setMockState } from "@common/test-utils/mocks/react-redux";

import KidsModeEntry from "./KidsModeEntry";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({ STRINGS: { KIDS_MODE: "Kids Mode" } });
});
// @rneui/themed ships untranspiled ESM, which this Jest config does not transform.
jest.mock("@rneui/themed", () => ({ Icon: () => null }));

describe("KidsModeEntry", () => {
  it("renders nothing while Kids Mode is off or never set", () => {
    setMockState({ kidsMode: undefined });
    expect(render(<KidsModeEntry navigate={jest.fn()} />).toJSON()).toBeNull();
    setMockState({ kidsMode: { enabled: false } });
    expect(render(<KidsModeEntry navigate={jest.fn()} />).toJSON()).toBeNull();
  });

  it("opens Kids Mode when enabled", () => {
    setMockState({ kidsMode: { enabled: true } });
    const navigate = jest.fn();
    const { getByLabelText } = render(<KidsModeEntry navigate={navigate} />);
    fireEvent.press(getByLabelText("Kids Mode"));
    expect(navigate).toHaveBeenCalledWith("KidsHome");
  });
});
