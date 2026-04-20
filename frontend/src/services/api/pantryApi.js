import { apiClient } from "./client";

async function detectIngredients(imageFile) {
  const formData = new FormData();
  formData.append("image_file", imageFile);
  return apiClient.request("/detect/", {
    method: "POST",
    body: formData,
  });
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
  detectIngredients,
  generateRecipes,
  chatRecipeGuide,
};
