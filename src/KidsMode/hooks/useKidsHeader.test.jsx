import React from "react";

import { render, renderHook } from "@testing-library/react-native";

import useKidsHeader from "./useKidsHeader";

jest.mock("@common/components", () => {
  const { Text } = require("react-native");
  return { AppBar: ({ title }) => <Text>{title}</Text>, BackIconComponent: () => null };
});

describe("useKidsHeader", () => {
  it("hides the native header and returns an app bar with the title", () => {
    const navigation = { setOptions: jest.fn() };
    const { result } = renderHook(() => useKidsHeader(navigation, "Japji Sahib"));
    expect(navigation.setOptions).toHaveBeenCalledWith({ headerShown: false });
    expect(render(result.current).getByText("Japji Sahib")).toBeTruthy();
  });
});
