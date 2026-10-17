import { exists, moveFile, unlink } from "react-native-fs";
import * as actionTypes from "@common/actions/actionTypes";
import { logError } from "@common";
import kidsMode from "./kidsModeReducer";
import { deleteKidsRecording, recordingUrl, recordKidsAttempt } from "./progressActions";

jest.mock("@common", () => ({ logError: jest.fn() }));

const result = {
  stars: 1,
  lines: [{ seq: 5, score: 70, words: [{ text: "ਸੋਚਿ", state: "check" }] }],
};

// Runs a thunk against the real reducer, as the store would.
const runWith = async (thunk, kids) => {
  let state = { kidsMode: kids };
  const dispatched = [];
  const dispatch = (action) => {
    dispatched.push(action);
    state = { kidsMode: kidsMode(state.kidsMode, action) };
  };
  const value = await thunk(dispatch, () => state);
  return { state: state.kidsMode, dispatched, value };
};

const initial = kidsMode(undefined, { type: "@@INIT" });
const withRecording = { ...initial, recordings: [{ path: "kids/a.m4a", pauri: 1, date: "" }] };

describe("Kids Mode progress actions", () => {
  const date = new Date(2026, 9, 16, 12);
  const path = `kids/pauri-1-${date.getTime()}.m4a`;

  beforeEach(() => jest.clearAllMocks());

  it("records the attempt and keeps its recording under its own name", async () => {
    const uri = "file:///test/documents/kids/pauri-1.m4a";
    const { state } = await runWith(recordKidsAttempt({ pauri: 1, result, uri }, date), initial);
    expect(moveFile).toHaveBeenCalledWith(
      "/test/documents/kids/pauri-1.m4a",
      `/test/documents/${path}`
    );
    expect(state.progress.best).toEqual({ 1: 1 });
    expect(state.progress.revisit[1]).toEqual([{ seq: 5, idx: 0, text: "ਸੋਚਿ" }]);
    expect(state.recordings).toEqual([{ path, pauri: 1, date: date.toISOString() }]);
    expect(recordingUrl(path)).toBe(`file:///test/documents/${path}`);
  });

  it("deletes the files of recordings beyond the latest three", async () => {
    const old = ["a", "b", "c"].map((name) => ({ path: `kids/${name}.m4a`, pauri: 1, date: "" }));
    const uri = "/test/documents/kids/pauri-1.m4a";
    const { state } = await runWith(recordKidsAttempt({ pauri: 1, result, uri }, date), {
      ...initial,
      recordings: old,
    });
    expect(state.recordings.map((r) => r.path)).toEqual(["kids/b.m4a", "kids/c.m4a", path]);
    expect(unlink).toHaveBeenCalledTimes(1);
    expect(unlink).toHaveBeenCalledWith("/test/documents/kids/a.m4a");
  });

  it("still records the attempt when the recording cannot be kept", async () => {
    moveFile.mockRejectedValueOnce(new Error("no file"));
    const { state, dispatched } = await runWith(
      recordKidsAttempt({ pauri: 1, result, uri: "/x.m4a" }, date),
      initial
    );
    expect(dispatched.map((a) => a.type)).toEqual([actionTypes.KIDS_MODE_RECORD_ATTEMPT]);
    expect(state.progress.best).toEqual({ 1: 1 });
    expect(state.recordings).toEqual([]);
    expect(logError).toHaveBeenCalled();
  });

  it("deletes the file and then its entry", async () => {
    const { state, value } = await runWith(deleteKidsRecording("kids/a.m4a"), withRecording);
    expect(unlink).toHaveBeenCalledWith("/test/documents/kids/a.m4a");
    expect(value).toBe(true);
    expect(state.recordings).toEqual([]);
  });

  it("drops the entry of a missing file but keeps one that could not be deleted", async () => {
    unlink.mockRejectedValueOnce(new Error("gone"));
    exists.mockResolvedValueOnce(false);
    const gone = await runWith(deleteKidsRecording("kids/a.m4a"), withRecording);
    expect(gone.state.recordings).toEqual([]);

    unlink.mockRejectedValueOnce(new Error("locked"));
    exists.mockResolvedValueOnce(true);
    const kept = await runWith(deleteKidsRecording("kids/a.m4a"), withRecording);
    expect(kept.value).toBe(false);
    expect(kept.state.recordings).toHaveLength(1);
    expect(logError).toHaveBeenCalled();
  });
});
