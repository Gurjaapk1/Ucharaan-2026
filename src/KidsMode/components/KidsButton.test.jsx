import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import KidsButton from "./KidsButton";

describe("KidsButton", () => {
  it("calls onPress", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<KidsButton title="Listen" onPress={onPress} />);
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalled();
  });

  it("ignores presses while disabled", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<KidsButton title="Listen" onPress={onPress} disabled />);
    fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
