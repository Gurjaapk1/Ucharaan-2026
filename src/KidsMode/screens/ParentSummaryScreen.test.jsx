import React from "react";

import { act, fireEvent, render } from "@testing-library/react-native";

import { getMockDispatch, setMockState } from "@common/test-utils/mocks/react-redux";

import ParentSummaryScreen from "./ParentSummaryScreen";

const mockPlay = jest.fn();
jest.mock("../hooks/useKidsAudio", () => () => ({ play: mockPlay }));
jest.mock("../hooks/useKidsHeader", () => () => null);
jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: {
      KIDS_PAURI: "Pauri",
      KIDS_STARS: "stars",
      KIDS_PRACTICE_DAYS: "Practice days",
      KIDS_PAURIS_PRACTISED: "Pauris practised",
      KIDS_PAURIS_WITH_STAR: "Pauris with a star",
      KIDS_BANIS_COMPLETED: "Banis completed",
      KIDS_CHECKED_ATTEMPTS: "checked attempts",
      KIDS_NO_IMPROVEMENTS: "Not enough checked attempts yet",
      KIDS_NO_REVIEW_WORDS: "No words to review",
      KIDS_NO_RECORDINGS: "No recordings saved.",
      KIDS_PLAY: "Play",
      KIDS_DELETE: "Delete",
      KIDS_DELETE_FAILED: "Could not delete",
      KIDS_RECORDINGS_PRIVACY: "Recordings stay on this phone",
    },
    StatusBarComponent: () => null,
  });
});

const attempt = (stars, day) => ({
  pauri: 1,
  stars,
  date: `${day}T10:00:00Z`,
  lines: [],
  focus: [],
});
const recording = { path: "kids/pauri-1-1.m4a", pauri: 1, date: "2026-10-16T10:00:00Z" };

describe("ParentSummaryScreen", () => {
  const navigation = { navigate: jest.fn(), setOptions: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    setMockState({
      kidsMode: {
        progress: {
          best: { 1: 3, 2: 0 },
          days: ["2026-10-15", "2026-10-16"],
          history: [attempt(1, "2026-10-15"), attempt(3, "2026-10-16")],
          revisit: { 2: [{ seq: 12, idx: 0, text: "ਸੋਚਿ" }] },
        },
        recordings: [recording],
      },
    });
  });

  it("separates practised pauris from completed ones and banis", () => {
    const { getByText } = render(<ParentSummaryScreen navigation={navigation} />);
    expect(getByText("Practice days")).toBeTruthy();
    expect(getByText("Pauris practised")).toBeTruthy();
    expect(getByText("Banis completed")).toBeTruthy();
    expect(getByText("ਸੋਚਿ")).toBeTruthy();
    expect(getByText("Pauri 1: 1 → 3 stars, 2 checked attempts")).toBeTruthy();
    expect(getByText("Recordings stay on this phone")).toBeTruthy();
  });

  it("shows no improvement from a single attempt", () => {
    setMockState({
      kidsMode: { progress: { best: { 1: 3 }, history: [attempt(3, "2026-10-16")] } },
    });
    const { getByText } = render(<ParentSummaryScreen navigation={navigation} />);
    expect(getByText("Not enough checked attempts yet")).toBeTruthy();
    expect(getByText("No recordings saved.")).toBeTruthy();
  });

  it("plays a saved recording from the documents folder", () => {
    const { getByText } = render(<ParentSummaryScreen navigation={navigation} />);
    fireEvent.press(getByText("Play"));
    expect(mockPlay).toHaveBeenCalledWith(
      expect.objectContaining({
        id: recording.path,
        url: `file:///test/documents/${recording.path}`,
      })
    );
  });

  it("deletes a recording and says so when it could not be deleted", async () => {
    getMockDispatch().mockResolvedValueOnce(false);
    const { getByText, findByText } = render(<ParentSummaryScreen navigation={navigation} />);
    await act(async () => fireEvent.press(getByText("Delete")));
    expect(getMockDispatch()).toHaveBeenCalledWith(expect.any(Function));
    expect(await findByText("Could not delete")).toBeTruthy();
  });
});
