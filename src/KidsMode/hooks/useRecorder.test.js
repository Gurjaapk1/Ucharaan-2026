import { PermissionsAndroid, Platform } from "react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import { mkdir } from "react-native-fs";
import { act, renderHook } from "@testing-library/react-native";
import useRecorder from "./useRecorder";

const mockStart = jest.fn(() => Promise.resolve("ok"));
const mockStop = jest.fn(() => Promise.resolve("file:///ignored"));
jest.mock("react-native-audio-recorder-player", () =>
  jest.fn(() => ({ startRecorder: mockStart, stopRecorder: mockStop }))
);
jest.mock("@common/TrackPlayerUtils", () => ({ resetPlayer: jest.fn(() => Promise.resolve()) }));

describe("useRecorder", () => {
  const { OS } = Platform;

  beforeEach(() => jest.clearAllMocks());
  afterEach(() => {
    Platform.OS = OS;
  });

  it("records to the kids folder as a file URL on iOS", async () => {
    Platform.OS = "ios";
    const { result } = renderHook(() => useRecorder());
    await act(async () => expect(await result.current.start("pauri-1")).toBe(true));
    expect(mkdir).toHaveBeenCalledWith("/test/documents/kids");
    expect(mockStart).toHaveBeenCalledWith("file:///test/documents/kids/pauri-1.m4a");
    expect(result.current.recording).toBe(true);
    let uri;
    await act(async () => {
      uri = await result.current.stop();
    });
    expect(uri).toBe("file:///test/documents/kids/pauri-1.m4a");
    expect(result.current.recording).toBe(false);
  });

  it("asks for the microphone on Android and stops if refused", async () => {
    Platform.OS = "android";
    jest.spyOn(PermissionsAndroid, "request").mockResolvedValue("denied");
    const { result } = renderHook(() => useRecorder());
    await act(async () => expect(await result.current.start("pauri-1")).toBe(false));
    expect(AudioRecorderPlayer).not.toHaveBeenCalled();
  });

  it("passes a plain path on Android", async () => {
    Platform.OS = "android";
    jest.spyOn(PermissionsAndroid, "request").mockResolvedValue("granted");
    const { result } = renderHook(() => useRecorder());
    await act(() => result.current.start("pauri-1"));
    expect(mockStart).toHaveBeenCalledWith("/test/documents/kids/pauri-1.m4a");
  });
});
