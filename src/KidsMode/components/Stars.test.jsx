import React from "react";

import { render } from "@testing-library/react-native";

import Stars from "./Stars";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({ STRINGS: { KIDS_OF_THREE_STARS: "of 3 stars" } });
});

describe("Stars", () => {
  it("draws three stars and names the count", () => {
    const { getByLabelText, getAllByText } = render(<Stars count={2} />);
    expect(getByLabelText("2 of 3 stars")).toBeTruthy();
    expect(getAllByText("★")).toHaveLength(3);
  });
});
