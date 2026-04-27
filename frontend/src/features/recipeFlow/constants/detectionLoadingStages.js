/**
 * Ordered stage list from backend SSE stream. Each stage has a
 * user-facing label for the loading panel.
 */
export const DETECTION_PIPELINE_STAGES = [
  { key: "reading", label: "Reading image" },
  { key: "detecting", label: "Running object detection" },
  { key: "detected", label: "Objects detected" },
  { key: "first_pass", label: "Identifying ingredients" },
  { key: "first_pass_completed", label: "Ingredient pass complete" },
  { key: "second_pass", label: "Rechecking uncertain items" },
  { key: "second_pass_completed", label: "Annotating image" },
  { key: "done", label: "Detection complete" },
];

const SERVER_STAGE_TO_UI_INDEX = DETECTION_PIPELINE_STAGES.reduce((acc, stage, index) => {
  acc[stage.key] = index;
  return acc;
}, {});

/** How many UI steps the progress bar uses (matches dot count). */
export const DETECTION_UI_STEP_COUNT = DETECTION_PIPELINE_STAGES.length;

export function serverStageToUiIndex(stageKey) {
  if (stageKey != null && Object.prototype.hasOwnProperty.call(SERVER_STAGE_TO_UI_INDEX, stageKey)) {
    return SERVER_STAGE_TO_UI_INDEX[stageKey];
  }
  return 0;
}

export function serverStageToLabel(stageKey) {
  const stage = DETECTION_PIPELINE_STAGES.find((item) => item.key === stageKey);
  return stage ? stage.label : "Processing";
}
