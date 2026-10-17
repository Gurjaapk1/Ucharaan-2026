// Only the names the app imports; the hooks are never called under test.
const unused = () => {
  throw new Error('expo-audio is not available under node --test');
};
export const RecordingPresets = { HIGH_QUALITY: {} };
export const getRecordingPermissionsAsync = unused;
export const requestRecordingPermissionsAsync = unused;
export const setAudioModeAsync = unused;
export const useAudioRecorder = unused;
export const useAudioRecorderState = unused;
export const useAudioStream = unused;
export const useAudioPlayer = unused;
export const useAudioPlayerStatus = unused;
