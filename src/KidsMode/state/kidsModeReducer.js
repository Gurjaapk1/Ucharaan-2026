import { REHYDRATE } from "redux-persist";
import * as actionTypes from "@common/actions/actionTypes";
import { addAttempt, keepLatest } from "./history";
import { recordResult } from "./progress";

const initialState = {
  enabled: false,
  scoringOptIn: false,
  reciter: null,
  progress: { coins: 0, best: {}, history: [], revisit: {}, days: [] },
  recordings: [],
};

const hasAll = (defaults, value) => Object.keys(defaults).every((key) => value[key] !== undefined);

// The persisted slice replaces the initial one wholesale, so keys added since it was saved are
// filled from the defaults. Complete state is returned as is, so selectors see no change.
const withDefaults = (state) => {
  const progress = state?.progress ?? {};
  if (state && hasAll(initialState, state) && hasAll(initialState.progress, progress)) {
    return state;
  }
  return { ...initialState, ...state, progress: { ...initialState.progress, ...progress } };
};

const kidsMode = (previous = initialState, action) => {
  // Returning a changed slice on rehydrate makes redux-persist keep it over the stored one.
  if (action.type === REHYDRATE) {
    return action.payload?.kidsMode ? withDefaults(action.payload.kidsMode) : previous;
  }
  const state = withDefaults(previous);
  switch (action.type) {
    case actionTypes.KIDS_MODE_TOGGLE:
      return { ...state, enabled: action.value };
    case actionTypes.KIDS_MODE_SCORING_OPT_IN:
      return { ...state, scoringOptIn: action.value };
    case actionTypes.KIDS_MODE_SET_RECITER:
      return { ...state, reciter: action.value };
    case actionTypes.KIDS_MODE_RECORD_RESULT: {
      const { pauri, stars } = action.value;
      return {
        ...state,
        progress: { ...state.progress, ...recordResult(state.progress, pauri, stars) },
      };
    }
    case actionTypes.KIDS_MODE_RECORD_ATTEMPT:
      return { ...state, progress: addAttempt(state.progress, action.value) };
    case actionTypes.KIDS_MODE_ADD_RECORDING:
      return { ...state, recordings: keepLatest([...state.recordings, action.value]) };
    case actionTypes.KIDS_MODE_DELETE_RECORDING:
      return { ...state, recordings: state.recordings.filter((r) => r.path !== action.value) };
    default:
      return state;
  }
};

export default kidsMode;
