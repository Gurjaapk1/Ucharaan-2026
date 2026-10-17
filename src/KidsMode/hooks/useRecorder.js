import { useCallback, useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import { DocumentDirectoryPath, mkdir } from "react-native-fs";
import { resetPlayer } from "@common/TrackPlayerUtils";

const KIDS_DIR = `${DocumentDirectoryPath}/kids`;

// iOS asks on first use from NSMicrophoneUsageDescription; Android needs a runtime request.
const askMicrophone = async () =>
  Platform.OS !== "android" ||
  (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)) ===
    PermissionsAndroid.RESULTS.GRANTED;

// Records one file per pauri under DocumentDirectoryPath/kids, replacing the last attempt.
const useRecorder = () => {
  const recorder = useRef(null);
  const path = useRef(null);
  const [recording, setRecording] = useState(false);

  const start = useCallback(async (name) => {
    if (!(await askMicrophone())) return false;
    // Android 7-9 also demand WRITE_EXTERNAL_STORAGE; unsupported rather than ask kids for storage.
    recorder.current = recorder.current || new AudioRecorderPlayer();
    path.current = `${KIDS_DIR}/${name}.m4a`;
    await mkdir(KIDS_DIR);
    // Playback and recording share one iOS audio session, so release the reciter's track first.
    await resetPlayer();
    // iOS treats a path without file:// as relative to Caches; Android wants a plain path.
    await recorder.current.startRecorder(
      Platform.OS === "ios" ? `file://${path.current}` : path.current
    );
    setRecording(true);
    return true;
  }, []);

  const stop = useCallback(async () => {
    await recorder.current.stopRecorder();
    setRecording(false);
    return `file://${path.current}`;
  }, []);

  useEffect(
    () => () => {
      recorder.current?.stopRecorder().catch(() => {});
    },
    []
  );

  return { recording, start, stop };
};

export default useRecorder;
