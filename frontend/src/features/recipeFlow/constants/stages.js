export const STAGES = [
  { id: "input", label: "Input" },
  { id: "synthesis", label: "Synthesis" },
  { id: "execution", label: "Execution" },
];

export const STAGE_COPY = {
  input: {
    title: "Curate the pantry snapshot",
    subtitle: "Upload one clean frame to initialize your ingredient trace.",
  },
  synthesis: {
    title: "Synthesize ingredient intent",
    subtitle: "Agent inspects detections, resolves ambiguity, and prepares execution.",
  },
  execution: {
    title: "Execute recipe strategy",
    subtitle: "Conversational plan with material constraints pinned in view.",
  },
};
