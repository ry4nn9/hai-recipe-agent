import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import { STAGES, STAGE_COPY } from "../constants/stages";

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="upload-icon" aria-hidden="true">
      <path
        d="M12 3l4 4-1.4 1.4-1.6-1.6V15h-2V6.8L9.4 8.4 8 7l4-4zm-7 12h14v6H5v-6z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function StagePanel({
  stage,
  fileName,
  ingredients,
  recipes,
  selectedRecipe,
  chatMessages,
  chatInput,
  activeIngredient,
  loadingDetect,
  loadingRecipes,
  loadingChat,
  error,
  onPickImage,
  onRunRecipes,
  onSelectRecipe,
  onPreviewRecipe,
  onClosePreview,
  previewRecipe,
  onOpenIngredient,
  onCloseIngredient,
  onEditIngredientField,
  onChatInputChange,
  onSendChat,
  chatStackRef,
}) {
  const content = STAGE_COPY[stage];
  const phaseNumber = STAGES.findIndex((stageItem) => stageItem.id === stage) + 1;

  return (
    <motion.section
      key={stage}
      className="stage-panel"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 1.02 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
      <div className="stage-head">
        <p className="micro-label">{`PHASE 0${phaseNumber}`}</p>
        <h2>{content.title}</h2>
        <p>{content.subtitle}</p>
      </div>

      {stage === "input" && (
        <div className="input-shell stage-content">
          <div
            className={`pill-image-frame upload-frame${loadingDetect ? " upload-frame--loading" : ""}`}
            role="button"
            tabIndex={loadingDetect ? -1 : 0}
            aria-busy={loadingDetect}
            aria-disabled={loadingDetect}
            onClick={loadingDetect ? undefined : onPickImage}
            onKeyDown={(event) => {
              if (loadingDetect) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onPickImage();
              }
            }}
          >
            {loadingDetect ? (
              <Loader2 className="upload-loader loader-spin" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <UploadIcon />
            )}
            <p className="micro-label">IMAGE INGEST</p>
            <p className="hint-text">
              {loadingDetect
                ? "Analyzing uploaded image…"
                : fileName
                  ? `Uploaded: ${fileName}`
                  : "No file selected"}
            </p>
          </div>
        </div>
      )}

      {stage === "synthesis" && (
        <div className="synthesis-minimal stage-content">
          <div className="synthesis-columns">
            <div className="synthesis-column synthesis-column--ingredients">
              <p className="micro-label">INGREDIENTS</p>
              <div className="ingredient-grid">
                {ingredients.length ? (
                  ingredients.map((item, idx) => (
                    <button
                      key={`${item.name}-${idx}`}
                      type="button"
                      className="ingredient-chip"
                      onClick={() => onOpenIngredient(item, idx)}
                    >
                      <span aria-hidden="true">◉</span>
                      <span>{item.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="hint-text">No ingredients detected yet.</p>
                )}
              </div>
              <button
                type="button"
                className="action-button synthesis-generate-btn"
                onClick={onRunRecipes}
                disabled={!ingredients.length || loadingRecipes}
                aria-busy={loadingRecipes}
              >
                {loadingRecipes ? (
                  <Loader2 className="processing-icon loader-spin" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Zap className="processing-icon icon-inactive" strokeWidth={1.5} aria-hidden="true" />
                )}
                {loadingRecipes ? "Generating…" : "Brainstorm"}
              </button>
            </div>

            <div className="synthesis-column synthesis-column--recipes">
              {recipes.length ? (
                <div className="recipe-option-list stage-section">
                  <p className="micro-label">RECIPE IDEAS</p>
                  {recipes.map((recipe, idx) => (
                    <button
                      key={`${recipe.title}-${idx}`}
                      type="button"
                      className="recipe-option-card"
                      onClick={() => onPreviewRecipe(recipe)}
                    >
                      <span className="recipe-option-main">
                        <span className="recipe-option-title">{recipe.title}</span>
                      </span>
                      <span className="recipe-option-meta">
                        <span>{recipe.prep_time || "Time n/a"}</span>
                        <span>{recipe.difficulty || "Difficulty n/a"}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="synthesis-recipes-empty">
                  <p className="micro-label">RECIPE OPTIONS</p>
                  <p className="hint-text">Generate recipes to see matches here.</p>
                </div>
              )}
            </div>
          </div>

          {previewRecipe ? (
            <div className="ingredient-modal-backdrop" onClick={onClosePreview}>
              <article
                className="ingredient-modal recipe-preview-card"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="recipe-preview-head">
                  <h3>{previewRecipe.title}</h3>
                  <p className="recipe-preview-description">{previewRecipe.description}</p>
                  <div className="recipe-preview-meta">
                    <span>{previewRecipe.prep_time || "Time n/a"}</span>
                    <span>{previewRecipe.difficulty || "Difficulty n/a"}</span>
                    <span>{previewRecipe.servings || "Servings n/a"}</span>
                  </div>
                </header>
                <section className="recipe-preview-section">
                  <p className="recipe-preview-section-title">Uses</p>
                  <div className="chip-line">
                    {(previewRecipe.ingredients_used || []).map((name) => (
                      <span key={name} className="status-chip ready">
                        {name}
                      </span>
                    ))}
                  </div>
                </section>
                <section className="recipe-preview-section">
                  <p className="recipe-preview-section-title">Missing</p>
                  <div className="chip-line">
                    {(previewRecipe.missing_ingredients || []).map((name) => (
                      <span key={name} className="status-chip pending">
                        {name}
                      </span>
                    ))}
                  </div>
                </section>
                <div className="button-row">
                  <button
                    type="button"
                    className="action-button action-button-secondary"
                    onClick={onClosePreview}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="action-button action-button-primary"
                    onClick={() => onSelectRecipe(previewRecipe)}
                  >
                    Let's Cook!
                  </button>
                </div>
              </article>
            </div>
          ) : null}

          {activeIngredient ? (
            <div className="ingredient-modal-backdrop" onClick={onCloseIngredient}>
              <article
                className="ingredient-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <p className="micro-label">INGREDIENT DETAILS</p>
                <p>
                  <strong>Name</strong>
                </p>
                <input
                  value={activeIngredient.name || ""}
                  onChange={(event) =>
                    onEditIngredientField(activeIngredient.index, "name", event.target.value)
                  }
                  placeholder="Ingredient name"
                />
                <p>
                  <strong>Quantity</strong>
                </p>
                <input
                  value={activeIngredient.quantity || ""}
                  onChange={(event) =>
                    onEditIngredientField(
                      activeIngredient.index,
                      "quantity",
                      event.target.value
                    )
                  }
                  placeholder="e.g. 3, 1 bunch, half"
                />
                <p>
                  <strong>Condition</strong>
                </p>
                <select
                  value={activeIngredient.condition || "unknown"}
                  onChange={(event) =>
                    onEditIngredientField(
                      activeIngredient.index,
                      "condition",
                      event.target.value
                    )
                  }
                >
                  <option value="fresh">fresh</option>
                  <option value="low">low</option>
                  <option value="unknown">unknown</option>
                </select>
                <button type="button" className="action-button" onClick={onCloseIngredient}>
                  Close
                </button>
              </article>
            </div>
          ) : null}
        </div>
      )}

      {stage === "execution" && (
        <div className="execution-shell center-shell stage-content">
          {!selectedRecipe ? (
            <article className="chat-bubble agent">
              <p className="micro-label">AGENT</p>
              <p>Select a recipe in phase 02 to start guided cooking.</p>
            </article>
          ) : (
            <div className="chat-shell">
              <p className="micro-label">COOKING GUIDE</p>
              <div className="chat-stack" ref={chatStackRef}>
                {chatMessages.map((bubble, idx) => (
                  <article
                    key={`${bubble.role}-${idx}`}
                    className={`chat-bubble ${bubble.role === "agent" ? "agent" : "user"}`}
                  >
                    <p className="micro-label">{bubble.role.toUpperCase()}</p>
                    <p>{bubble.text}</p>
                  </article>
                ))}
                {loadingChat ? (
                  <article className="chat-bubble agent">
                    <p className="micro-label">AGENT</p>
                    <p>
                      <Zap className="processing-icon icon-active" strokeWidth={1.5} aria-hidden="true" />
                      Thinking through the next cooking step...
                    </p>
                  </article>
                ) : null}
              </div>
              <form className="chat-form" onSubmit={onSendChat}>
                <input
                  value={chatInput}
                  onChange={onChatInputChange}
                  placeholder="Tell the agent what step you are on..."
                />
                <button
                  type="submit"
                  className="action-button action-button-primary"
                  disabled={!chatInput.trim() || loadingChat}
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      {error ? <p className="error-text">{error}</p> : null}
    </motion.section>
  );
}
