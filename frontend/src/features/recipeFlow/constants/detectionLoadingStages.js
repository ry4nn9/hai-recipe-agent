/**
 * UI steps for the detection progress strip (5 dots / bar segments).
 * Maps server `stage` keys from `/detect/` SSE to a 0-based index.
 */
const SERVER_STAGE_TO_UI_INDEX = {
  reading: 0,
  detecting: 1,
  detected: 1,
  first_pass: 2,
  first_pass_completed: 2,
  second_pass: 3,
  second_pass_completed: 3,
  done: 4,
};

const SERVER_STAGE_TITLES = {
  reading: "Preparing image",
  detecting: "Scanning the frame",
  detected: "Objects located",
  first_pass: "Mapping to ingredients",
  first_pass_completed: "Ingredients identified",
  second_pass: "Refining uncertain items",
  second_pass_completed: "Drawing the preview",
  done: "Complete",
};

/** How many UI steps the progress bar uses (matches dot count). */
export const DETECTION_UI_STEP_COUNT = 5;

export function serverStageToUiIndex(stageKey) {
  if (stageKey != null && Object.prototype.hasOwnProperty.call(SERVER_STAGE_TO_UI_INDEX, stageKey)) {
    return SERVER_STAGE_TO_UI_INDEX[stageKey];
  }
  return 0;
}

export function titleForServerStage(stageKey) {
  if (stageKey != null && Object.prototype.hasOwnProperty.call(SERVER_STAGE_TITLES, stageKey)) {
    return SERVER_STAGE_TITLES[stageKey];
  }
  return "Working…";
}
