export function getRecipeMaterials(selectedRecipe) {
  if (!selectedRecipe) return [];

  const ready = (selectedRecipe.ingredients_used || []).map((name) => ({
    name,
    state: "ready",
  }));
  const missing = (selectedRecipe.missing_ingredients || []).map((name) => ({
    name,
    state: "pending",
  }));

  return [...ready, ...missing];
}
