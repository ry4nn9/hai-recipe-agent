import { API_BASE_URL, apiClient } from "./client";

/**
 * POST /detect/ — consumes Server-Sent Events (data: {json}\\n\\n).
 * Calls onEvent for each server payload; resolves with { image, ingredients } on "done".
 */
async function detectIngredientsStream(imageFile, onEvent) {
  const formData = new FormData();
  formData.append("image_file", imageFile);

  const response = await fetch(`${API_BASE_URL}/detect/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let donePayload = null;

  const handleEvent = (ev) => {
    if (!ev || typeof ev !== "object") return;
    onEvent?.(ev);
    if (ev.stage === "error") {
      throw new Error(ev.message || "Detection failed");
    }
    if (ev.stage === "done") {
      donePayload = ev;
    }
  };

  const parseDataLine = (line) => {
    const prefix = "data:";
    const trimmed = line.trimStart();
    if (!trimmed.startsWith(prefix)) return;
    const jsonText = trimmed.slice(prefix.length).trim();
    if (!jsonText) return;
    try {
      handleEvent(JSON.parse(jsonText));
    } catch {
      /* ignore malformed chunk */
    }
  };

  const consumeBlocks = (text) => {
    const parts = text.split(/\n\n/);
    const incomplete = parts.pop() ?? "";
    for (const block of parts) {
      for (const line of block.split("\n")) {
        parseDataLine(line);
      }
    }
    return incomplete;
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = consumeBlocks(buffer);
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    for (const block of buffer.split(/\n\n/)) {
      for (const line of block.split("\n")) {
        parseDataLine(line);
      }
    }
  }

  if (!donePayload) {
    throw new Error("Stream ended before detection completed");
  }

  return {
    image: donePayload.image,
    ingredients: Array.isArray(donePayload.ingredients) ? donePayload.ingredients : [],
  };
}

async function generateRecipes(ingredients) {
  return apiClient.request("/recipes/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ingredients),
  });
}

async function chatRecipeGuide({ selectedRecipe, ingredients, history, message }) {
  return apiClient.request("/recipes/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selected_recipe: selectedRecipe,
      ingredients,
      history,
      message,
    }),
  });
}

export const pantryApi = {
  detectIngredientsStream,
  generateRecipes,
  chatRecipeGuide,
};
