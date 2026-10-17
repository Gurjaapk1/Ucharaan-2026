import TrackPlayer, { useProgress } from "react-native-track-player";
import { act, renderHook } from "@testing-library/react-native";
import useKidsAudio from "./useKidsAudio";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({ logError: jest.fn(), logMessage: jest.fn() });
});

const track = { id: "t", url: "https://cdn.example/a.m4a" };

describe("useKidsAudio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProgress.mockReturnValue({ position: 0 });
  });

  it("loads the track, seeks to the start and plays", async () => {
    const { result } = renderHook(() => useKidsAudio());
    await act(() => result.current.play(track, 34.9, 61.7));
    expect(TrackPlayer.reset).toHaveBeenCalled();
    expect(TrackPlayer.add).toHaveBeenCalledWith(track);
    expect(TrackPlayer.seekTo).toHaveBeenCalledWith(34.9);
    expect(TrackPlayer.play).toHaveBeenCalled();
    expect(result.current.playing).toBe(true);
  });

  it("pauses at the end of the range, not on a stale position", async () => {
    useProgress.mockReturnValue({ position: 500 });
    const { result, rerender } = renderHook(() => useKidsAudio());
    await act(() => result.current.play(track, 10, 20));
    expect(result.current.playing).toBe(true);

    useProgress.mockReturnValue({ position: 15 });
    rerender();
    useProgress.mockReturnValue({ position: 20.1 });
    rerender();
    expect(TrackPlayer.pause).toHaveBeenCalled();
    expect(result.current.playing).toBe(false);
  });
});
