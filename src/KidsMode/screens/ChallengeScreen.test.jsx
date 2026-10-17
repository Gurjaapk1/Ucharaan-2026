import React from "react";

import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import { getMockDispatch, setMockState } from "@common/test-utils/mocks/react-redux";

import useRecorder from "../hooks/useRecorder";
import { scoreRecording } from "../scoring/client";
import { recordKidsResult } from "../state/actions";

import ChallengeScreen from "./ChallengeScreen";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: {
      KIDS_BEGIN: "Begin challenge",
      KIDS_FINISH: "Finish and check",
      KIDS_CHECKING: "Checking…",
      KIDS_TRY_AGAIN: "Try again",
      KIDS_TURN_ON_CHECKING: "Turn on checking in Settings",
      KIDS_UNCLEAR: "We could not hear that clearly",
      KIDS_CHECK_FAILED: "That recitation could not be checked",
    },
    StatusBarComponent: () => null,
    logError: jest.fn(),
  });
});
jest.mock("../hooks/useKidsHeader", () => () => null);
jest.mock("../hooks/useRecorder", () => jest.fn());
jest.mock("../data/japji", () => ({ PAURI_SEQS: { 1: [5, 6, 7, 8, 9, 10] } }));
jest.mock("../hooks/usePauriLines", () => () => [
  {
    seq: 5,
    words: [{ text: "ਸੋਚੈ" }, { text: "ਸੋਚਿ" }],
  },
]);
jest.mock("../scoring/client", () => ({
  fetchManifest: jest.fn(() => Promise.resolve(null)),
  scoreRecording: jest.fn(),
  referenceUrl: (path) => path,
}));

const URI = "file:///test/documents/kids/pauri-1.m4a";
// 85% of words like the reciter is two stars under the default bands.
const SCORED = {
  status: "ok",
  lines: [
    {
      seq: 5,
      share_like: 0.85,
      words: [
        { idx: 0, state: "like" },
        { idx: 1, state: "check" },
      ],
    },
  ],
  focus: { seq: 5, idx: 1 },
};

const navigation = { navigate: jest.fn(), replace: jest.fn(), setOptions: jest.fn() };
const recorder = { start: jest.fn(() => Promise.resolve(true)), stop: jest.fn() };
const screen = () => <ChallengeScreen navigation={navigation} route={{ params: { pauri: 1 } }} />;

// Begins, lets the recorder report it is recording, then finishes; stop resolves when told to.
const reciteAndFinish = async () => {
  let release;
  recorder.stop.mockReturnValue(
    new Promise((resolve) => {
      release = () => resolve(URI);
    })
  );
  useRecorder.mockReturnValue({ ...recorder, recording: false });
  const view = render(screen());
  fireEvent.press(view.getByText("Begin challenge"));
  await waitFor(() => expect(recorder.start).toHaveBeenCalledWith("pauri-1"));
  useRecorder.mockReturnValue({ ...recorder, recording: true });
  view.rerender(screen());
  fireEvent.press(view.getByText("Finish and check"));
  expect(view.getByText("Checking…")).toBeTruthy();
  await act(async () => release());
  return view;
};

describe("ChallengeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMockState({ kidsMode: { scoringOptIn: true, reciter: "ggs", progress: { best: {} } } });
  });

  it("asks for the Settings opt-in and records and uploads nothing without it", () => {
    setMockState({ kidsMode: { scoringOptIn: false, progress: { best: {} } } });
    useRecorder.mockReturnValue({ ...recorder, recording: false });
    const view = render(screen());
    expect(view.getByText("Turn on checking in Settings")).toBeTruthy();
    expect(view.queryByText("Begin challenge")).toBeNull();
    expect(recorder.start).not.toHaveBeenCalled();
    expect(scoreRecording).not.toHaveBeenCalled();
  });

  it("records, shows checking, then opens results with word states, focus and coins", async () => {
    scoreRecording.mockResolvedValue(SCORED);
    await reciteAndFinish();
    expect(scoreRecording).toHaveBeenCalledWith(URI, {
      reciter: "ggs",
      seqs: [5, 6, 7, 8, 9, 10],
      optedIn: true,
    });
    expect(getMockDispatch()).toHaveBeenCalledWith(recordKidsResult(1, 2));
    const [route, params] = navigation.replace.mock.calls[0];
    expect(route).toBe("KidsResults");
    expect(params).toMatchObject({ pauri: 1, award: 20, result: { score: 85, stars: 2 } });
    expect(params.result.lines[0].words.map((word) => word.state)).toEqual(["like", "check"]);
    expect(params.result.focus).toEqual({ line: 0, word: 1 });
  });

  it("awards no coins when the same star count is earned again", async () => {
    setMockState({
      kidsMode: { scoringOptIn: true, reciter: "ggs", progress: { best: { 1: 2 } } },
    });
    scoreRecording.mockResolvedValue(SCORED);
    await reciteAndFinish();
    expect(navigation.replace).toHaveBeenCalledWith(
      "KidsResults",
      expect.objectContaining({ award: 0 })
    );
  });

  it("offers a retry and no coins when the recording is unclear", async () => {
    scoreRecording.mockResolvedValue({ status: "unclear" });
    const view = await reciteAndFinish();
    useRecorder.mockReturnValue({ ...recorder, recording: false });
    view.rerender(screen());
    expect(view.getByText("We could not hear that clearly")).toBeTruthy();
    expect(view.getByText("Try again")).toBeTruthy();
    expect(getMockDispatch()).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("says the check failed when the service cannot be reached", async () => {
    scoreRecording.mockRejectedValue(new Error("offline"));
    const view = await reciteAndFinish();
    expect(view.getByText("That recitation could not be checked")).toBeTruthy();
    expect(getMockDispatch()).not.toHaveBeenCalled();
  });
});
