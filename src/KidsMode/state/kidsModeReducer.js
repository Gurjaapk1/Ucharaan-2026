import * as actionTypes from "@common/actions/actionTypes";
import { recordResult } from "./progress";

const initialState = {
  enabled: false,
  scoringOptIn: false,
  reciter: null,
  progress: { coins: 0, best: {} },
};

const kidsMode = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.KIDS_MODE_TOGGLE:
      return { ...state, enabled: action.value };
    case actionTypes.KIDS_MODE_SCORING_OPT_IN:
      return { ...state, scoringOptIn: action.value };
    case actionTypes.KIDS_MODE_SET_RECITER:
      return { ...state, reciter: action.value };
    case actionTypes.KIDS_MODE_RECORD_RESULT: {
      const { pauri, stars } = action.value;
      return { ...state, progress: recordResult(state.progress, pauri, stars) };
    }
    default:
      return state;
  }
};

export default kidsMode;
