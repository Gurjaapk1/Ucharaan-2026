import { DocumentDirectoryPath, exists, moveFile, unlink } from "react-native-fs";
import * as actionTypes from "@common/actions/actionTypes";
import { logError } from "@common";
import { toAttempt } from "./history";

// Stored relative to the documents folder: iOS moves the app container on update, so an
// absolute path saved today would not find the file after the next update.
export const recordingFile = (path) => `${DocumentDirectoryPath}/${path}`;
export const recordingUrl = (path) => `file://${recordingFile(path)}`;

export const attemptRecorded = (attempt) => ({
  type: actionTypes.KIDS_MODE_RECORD_ATTEMPT,
  value: attempt,
});

export const recordingSaved = (recording) => ({
  type: actionTypes.KIDS_MODE_ADD_RECORDING,
  value: recording,
});

export const recordingDeleted = (path) => ({
  type: actionTypes.KIDS_MODE_DELETE_RECORDING,
  value: path,
});

// Records a checked attempt, then keeps its recording under its own name. The reducer keeps
// the latest recordings per pauri; the files it dropped are deleted here.
export const recordKidsAttempt =
  ({ pauri, result, uri }, date = new Date()) =>
  async (dispatch, getState) => {
    const attempt = toAttempt(pauri, result, date);
    dispatch(attemptRecorded(attempt));
    if (!uri) return;
    const path = `kids/pauri-${pauri}-${date.getTime()}.m4a`;
    try {
      await moveFile(uri.replace(/^file:\/\//, ""), recordingFile(path));
    } catch (error) {
      logError(error);
      return;
    }
    const before = getState().kidsMode?.recordings ?? [];
    dispatch(recordingSaved({ path, pauri, date: attempt.date }));
    const kept = new Set((getState().kidsMode?.recordings ?? []).map((r) => r.path));
    await Promise.all(
      before
        .filter((r) => !kept.has(r.path))
        .map((r) => unlink(recordingFile(r.path)).catch(logError))
    );
  };

// A file that could not be deleted keeps its entry, so the parent can still see and retry it.
export const deleteKidsRecording = (path) => async (dispatch) => {
  try {
    await unlink(recordingFile(path));
  } catch (error) {
    if (await exists(recordingFile(path)).catch(() => true)) {
      logError(error);
      return false;
    }
  }
  dispatch(recordingDeleted(path));
  return true;
};
