import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Loader2, Plus, Trash2, Zap } from "lucide-react";
import MotionButton from "../../../components/MotionButton.jsx";
import { STAGES, STAGE_COPY } from "../constants/stages";

const chipSpring = { type: "spring", stiffness: 480, damping: 26 };
const modalBackdropTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };
const modalPanelSpring = { type: "spring", stiffness: 380, damping: 32 };

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
  annotatedImageBase64,
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
  onOpenAddIngredient,
  onCloseIngredient,
  onSaveNewIngredient,
  onDeleteIngredient,
  onEditIngredientField,
  onChatInputChange,
  onSendChat,
  chatStackRef,
}) {
  const [detectionPreviewOpen, setDetectionPreviewOpen] = useState(false);

  useEffect(() => {
    if (!annotatedImageBase64) setDetectionPreviewOpen(false);
  }, [annotatedImageBase64]);

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
          <motion.div
            className={`pill-image-frame upload-frame motion-upload-frame${loadingDetect ? " upload-frame--loading" : ""}`}
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
            whileHover={
              loadingDetect ? undefined : { scale: 1.015, y: -3, transition: { duration: 0.2 } }
            }
            whileTap={loadingDetect ? undefined : { scale: 0.985 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
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
          </motion.div>
        </div>
      )}

      {stage === "synthesis" && (
        <div className="synthesis-minimal stage-content">
          <div className="synthesis-columns">
            <div className="synthesis-column synthesis-column--ingredients">
              <section className="synthesis-panel-section" aria-labelledby="synthesis-ingredients-heading">
                <p className="micro-label" id="synthesis-ingredients-heading">
                  INGREDIENTS
                </p>
                <div className="ingredient-grid">
                  {ingredients.length ? (
                    ingredients.map((item, idx) => (
                      <motion.button
                        key={`${item.name}-${idx}`}
                        type="button"
                        className="ingredient-chip motion-ingredient-chip"
                        onClick={() => onOpenIngredient(item, idx)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        transition={chipSpring}
                      >
                        <span aria-hidden="true">◉</span>
                        <span>{item.name}</span>
                      </motion.button>
                    ))
                  ) : (
                    <p className="hint-text">No ingredients detected yet.</p>
                  )}
                </div>
                <MotionButton
                  type="button"
                  className="action-button action-button-secondary synthesis-add-ingredient-btn"
                  onClick={onOpenAddIngredient}
                >
                  <Plus className="processing-icon" strokeWidth={1.5} aria-hidden="true" />
                  Add ingredient
                </MotionButton>
              </section>

              {annotatedImageBase64 ? (
                <section className="synthesis-panel-section" aria-labelledby="synthesis-detection-heading">
                  <p className="micro-label" id="synthesis-detection-heading">
                    DETECTION
                  </p>
                  <p className="hint-text synthesis-section-hint">
                    Open the annotated image to see how items were located on your photo.
                  </p>
                  <MotionButton
                    type="button"
                    className="action-button action-button-secondary synthesis-preview-open-btn"
                    onClick={() => setDetectionPreviewOpen(true)}
                  >
                    <Eye className="processing-icon" strokeWidth={1.5} aria-hidden="true" />
                    View detection preview
                  </MotionButton>
                </section>
              ) : null}

              <section className="synthesis-panel-section synthesis-panel-section--brainstorm">
                <MotionButton
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
                </MotionButton>
              </section>
            </div>

            <div className="synthesis-column synthesis-column--recipes">
              <section className="synthesis-panel-section synthesis-panel-section--recipes">
                {recipes.length ? (
                  <div className="recipe-option-list stage-section">
                    <p className="micro-label">RECIPE IDEAS</p>
                    {recipes.map((recipe, idx) => (
                      <motion.button
                        key={`${recipe.title}-${idx}`}
                        type="button"
                        className="recipe-option-card motion-recipe-card"
                        onClick={() => onPreviewRecipe(recipe)}
                        whileHover={{ scale: 1.02, y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={chipSpring}
                      >
                        <span className="recipe-option-main">
                          <span className="recipe-option-title">{recipe.title}</span>
                        </span>
                        <span className="recipe-option-meta">
                          <span>{recipe.prep_time || "Time n/a"}</span>
                          <span>{recipe.difficulty || "Difficulty n/a"}</span>
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="synthesis-recipes-empty">
                    <p className="micro-label">RECIPE OPTIONS</p>
                    <p className="hint-text">Generate recipes to see matches here.</p>
                  </div>
                )}
              </section>
            </div>
          </div>

          <AnimatePresence>
            {detectionPreviewOpen && annotatedImageBase64 ? (
              <motion.div
                key="detection-preview"
                className="ingredient-modal-backdrop"
                role="dialog"
                aria-modal="true"
                aria-labelledby="detection-preview-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={modalBackdropTransition}
                onClick={() => setDetectionPreviewOpen(false)}
              >
                <motion.article
                  className="ingredient-modal detection-preview-modal"
                  initial={{ opacity: 0, y: 36, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.96 }}
                  transition={modalPanelSpring}
                  onClick={(event) => event.stopPropagation()}
                >
                  <p className="micro-label" id="detection-preview-title">
                    DETECTION PREVIEW
                  </p>
                  <div className="detection-preview-frame">
                    <img
                      src={`data:image/jpeg;base64,${annotatedImageBase64}`}
                      alt="Pantry photo with detected ingredients highlighted"
                      className="detection-preview-img"
                    />
                  </div>
                  <MotionButton type="button" className="action-button" onClick={() => setDetectionPreviewOpen(false)}>
                    Close
                  </MotionButton>
                </motion.article>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {previewRecipe ? (
              <motion.div
                key="recipe-preview"
                className="ingredient-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={modalBackdropTransition}
                onClick={onClosePreview}
              >
                <motion.article
                  className="ingredient-modal recipe-preview-card"
                  initial={{ opacity: 0, y: 44, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.96 }}
                  transition={modalPanelSpring}
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
                    <MotionButton type="button" className="action-button action-button-secondary" onClick={onClosePreview}>
                      Close
                    </MotionButton>
                    <MotionButton
                      type="button"
                      className="action-button action-button-primary"
                      onClick={() => onSelectRecipe(previewRecipe)}
                    >
                      Let's Cook!
                    </MotionButton>
                  </div>
                </motion.article>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {activeIngredient ? (
              <motion.div
                key="ingredient-modal"
                className="ingredient-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={modalBackdropTransition}
                onClick={onCloseIngredient}
              >
                <motion.article
                  className="ingredient-modal"
                  initial={{ opacity: 0, y: 32, scale: 0.93 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.97 }}
                  transition={modalPanelSpring}
                  onClick={(event) => event.stopPropagation()}
                >
                  <p className="micro-label">
                    {activeIngredient.isNew ? "NEW INGREDIENT" : "INGREDIENT DETAILS"}
                  </p>
                  <p>
                    <strong>Name</strong>
                  </p>
                  <input
                    value={activeIngredient.name || ""}
                    onChange={(event) =>
                      onEditIngredientField(activeIngredient.index, "name", event.target.value)
                    }
                    placeholder="Ingredient name"
                    autoFocus={activeIngredient.isNew}
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
                  <div className="ingredient-modal-actions">
                    {activeIngredient.isNew ? (
                      <>
                        <MotionButton type="button" className="action-button" onClick={onCloseIngredient}>
                          Cancel
                        </MotionButton>
                        <MotionButton type="button" className="action-button action-button-primary" onClick={onSaveNewIngredient}>
                          <Plus className="processing-icon" strokeWidth={1.5} aria-hidden="true" />
                          Add
                        </MotionButton>
                      </>
                    ) : (
                      <>
                        <MotionButton
                          type="button"
                          className="action-button action-button-danger"
                          onClick={() => onDeleteIngredient(activeIngredient.index)}
                        >
                          <Trash2 className="processing-icon" strokeWidth={1.5} aria-hidden="true" />
                          Delete
                        </MotionButton>
                        <MotionButton type="button" className="action-button" onClick={onCloseIngredient}>
                          Close
                        </MotionButton>
                      </>
                    )}
                  </div>
                </motion.article>
              </motion.div>
            ) : null}
          </AnimatePresence>
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
                <MotionButton
                  type="submit"
                  className="action-button action-button-primary"
                  disabled={!chatInput.trim() || loadingChat}
                >
                  Send
                </MotionButton>
              </form>
            </div>
          )}
        </div>
      )}
      {error ? <p className="error-text">{error}</p> : null}
    </motion.section>
  );
}
