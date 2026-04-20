import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { pantryApi } from "./api/pantry";

const STAGES = [
  { id: "input", label: "Input" },
  { id: "synthesis", label: "Synthesis" },
  { id: "execution", label: "Execution" },
];

const STAGE_COPY = {
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

function Header() {
  return (
    <header className="app-header">
      <p className="micro-label">CULTURAL RECIPE SERVICE</p>
      <h1 className="display-title">
        Warm <em>Organic</em> Agent
      </h1>
    </header>
  );
}

function StageNav({ stage, setStage, unlockedStage }) {
  return (
    <nav className="stage-nav" aria-label="phase navigation">
      {STAGES.map((s, idx) => (
        <button
          key={s.id}
          type="button"
          className={`stage-pill ${stage === s.id ? "is-active" : ""}`}
          disabled={idx > unlockedStage}
          onClick={() => setStage(s.id)}
        >
          <span className="micro-label">{`0${idx + 1}`}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </nav>
  );
}

function StageCard({
  stage,
  imageUrl,
  fileName,
  ingredients,
  recipes,
  selectedRecipe,
  chatMessages,
  chatInput,
  loadingDetect,
  loadingRecipes,
  loadingChat,
  error,
  onPickImage,
  onRunDetect,
  onRunRecipes,
  onSelectRecipe,
  onChatInputChange,
  onSendChat,
}) {
  const content = STAGE_COPY[stage];
  const phaseNumber = STAGES.findIndex((x) => x.id === stage) + 1;

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
        <div className="input-shell">
          <div className="pill-image-frame">
            <img
              src={
                imageUrl ||
                "https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=1600&auto=format&fit=crop"
              }
              alt="Pantry still life"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="button-row">
            <button type="button" className="action-button" onClick={onPickImage}>
              Upload Pantry Image
            </button>
            <button
              type="button"
              className="action-button"
              onClick={onRunDetect}
              disabled={!imageUrl || loadingDetect}
            >
              {loadingDetect ? "Analyzing..." : "Run Ingredient Detection"}
            </button>
          </div>
          {fileName ? <p className="hint-text">Selected file: {fileName}</p> : null}
        </div>
      )}

      {stage === "synthesis" && (
        <div className="grid-synthesis">
          <div className="utility-box dashed">
            <p className="micro-label">VISION TRACE</p>
            <p>
              {ingredients.length
                ? ingredients.map((item) => item.name).join(", ")
                : "No ingredients detected yet. Run detection in phase 01."}
            </p>
          </div>
          <div className="utility-box">
            <p className="micro-label">MODEL CALIBRATION</p>
            <p>
              {ingredients.length
                ? `${ingredients.length} ingredients ready for recipe generation`
                : "Awaiting image analysis"}
            </p>
          </div>
          <div className="utility-box">
            <p className="micro-label">NEXT ACTION</p>
            <button
              type="button"
              className="action-button"
              onClick={onRunRecipes}
              disabled={!ingredients.length || loadingRecipes}
            >
              {loadingRecipes ? "Generating Recipes..." : "Generate Recipes"}
            </button>
          </div>

          <div className="recipe-grid">
            {!recipes.length ? (
              <div className="utility-box dashed">
                <p className="micro-label">RECIPE OPTIONS</p>
                <p>Generate recipes to view selectable options.</p>
              </div>
            ) : (
              recipes.map((recipe, idx) => (
                <article key={`${recipe.title}-${idx}`} className="recipe-card">
                  <p className="micro-label">{`OPTION 0${idx + 1}`}</p>
                  <h3>{recipe.title}</h3>
                  <p>{recipe.description}</p>
                  <div className="recipe-meta">
                    <span>{recipe.prep_time}</span>
                    <span>{recipe.difficulty}</span>
                    <span>{recipe.servings}</span>
                  </div>
                  <p className="chip-line">
                    {(recipe.ingredients_used || []).map((name) => (
                      <span key={name} className="status-chip ready">
                        {name}
                      </span>
                    ))}
                  </p>
                  <p className="chip-line">
                    {(recipe.missing_ingredients || []).map((name) => (
                      <span key={name} className="status-chip pending">
                        {name}
                      </span>
                    ))}
                  </p>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => onSelectRecipe(recipe)}
                  >
                    Select Recipe
                  </button>
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {stage === "execution" && (
        <div className="execution-shell">
          {!selectedRecipe ? (
            <article className="chat-bubble agent">
              <p className="micro-label">AGENT</p>
              <p>Select a recipe in phase 02 to start guided cooking.</p>
            </article>
          ) : (
            <div className="chat-shell">
              <article className="utility-box">
                <p className="micro-label">SELECTED RECIPE</p>
                <h3>{selectedRecipe.title}</h3>
                <p>{selectedRecipe.description}</p>
                <p className="recipe-meta">
                  <span>{selectedRecipe.prep_time}</span>
                  <span>{selectedRecipe.difficulty}</span>
                  <span>{selectedRecipe.servings}</span>
                </p>
              </article>
              <div className="chat-stack">
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
                    <p>Thinking through the next cooking step...</p>
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
                  className="action-button"
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

function DiagnosticSidebar({ selectedRecipe, materials }) {
  return (
    <aside className="diagnostic-sidebar">
      <p className="micro-label">MATERIAL REQUIREMENTS</p>
      {selectedRecipe ? (
        <>
          <p className="sidebar-title">{selectedRecipe.title}</p>
          <ul>
            {materials.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <span className={`status-chip ${item.state}`}>
                  {item.state === "ready" ? "Ready" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Select a recipe to lock material requirements.</p>
      )}
    </aside>
  );
}

export default function App() {
  const [stage, setStage] = useState("input");
  const [unlockedStage, setUnlockedStage] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingDetect, setLoadingDetect] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const materials = useMemo(() => {
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
  }, [selectedRecipe]);

  const showSidebar = useMemo(() => stage === "execution", [stage]);

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setImageUrl(URL.createObjectURL(file));
    setIngredients([]);
    setRecipes([]);
    setSelectedRecipe(null);
    setChatMessages([]);
    setChatInput("");
    setError("");
    setStage("input");
    setUnlockedStage(0);
  };

  const runDetect = async () => {
    if (!selectedImage) return;
    setLoadingDetect(true);
    setError("");
    try {
      const detected = await pantryApi.detectIngredients(selectedImage);
      setIngredients(Array.isArray(detected) ? detected : []);
      setUnlockedStage(1);
      setStage("synthesis");
    } catch (e) {
      setError(`Detection failed: ${e.message}`);
    } finally {
      setLoadingDetect(false);
    }
  };

  const runRecipes = async () => {
    if (!ingredients.length) return;
    setLoadingRecipes(true);
    setError("");
    try {
      const generated = await pantryApi.generateRecipes(ingredients);
      setRecipes(Array.isArray(generated) ? generated : []);
      setSelectedRecipe(null);
      setChatMessages([]);
      setChatInput("");
    } catch (e) {
      setError(`Recipe generation failed: ${e.message}`);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setUnlockedStage(2);
    setStage("execution");
    setChatMessages([
      {
        role: "agent",
        text: `Great choice. We'll cook "${recipe.title}" one step at a time. Tell me when you're ready to start prep.`,
      },
    ]);
    setChatInput("");
    setError("");
  };

  const handleSendChat = async (event) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || !selectedRecipe) return;

    const nextHistory = [...chatMessages, { role: "user", text: message }];
    setChatMessages(nextHistory);
    setChatInput("");
    setLoadingChat(true);
    setError("");

    try {
      const response = await pantryApi.chatRecipeGuide({
        selectedRecipe,
        ingredients,
        history: nextHistory,
        message,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: response.reply || "Let's continue. What's your current step?",
        },
      ]);
    } catch (e) {
      setError(`Guide chat failed: ${e.message}`);
    } finally {
      setLoadingChat(false);
    }
  };

  const setStageWithinProgress = (nextStage) => {
    const idx = STAGES.findIndex((s) => s.id === nextStage);
    if (idx <= unlockedStage) {
      setStage(nextStage);
    }
  };

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <div className="app-shell">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageSelect}
      />
      <Header />
      <StageNav
        stage={stage}
        setStage={setStageWithinProgress}
        unlockedStage={unlockedStage}
      />

      <main className="viewport">
        <AnimatePresence mode="wait">
          <StageCard
            stage={stage}
            imageUrl={imageUrl}
            fileName={selectedImage?.name}
            ingredients={ingredients}
            recipes={recipes}
            selectedRecipe={selectedRecipe}
            chatMessages={chatMessages}
            chatInput={chatInput}
            loadingDetect={loadingDetect}
            loadingRecipes={loadingRecipes}
            loadingChat={loadingChat}
            error={error}
            onPickImage={handlePickImage}
            onRunDetect={runDetect}
            onRunRecipes={runRecipes}
            onSelectRecipe={handleSelectRecipe}
            onChatInputChange={(e) => setChatInput(e.target.value)}
            onSendChat={handleSendChat}
          />
        </AnimatePresence>
        {showSidebar && (
          <DiagnosticSidebar selectedRecipe={selectedRecipe} materials={materials} />
        )}
      </main>
    </div>
  );
}
