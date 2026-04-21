import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  AppHeader,
  DiagnosticSidebar,
  StageNavigation,
  StagePanel,
  STAGES,
  getRecipeMaterials,
} from "./features/recipeFlow";
import { pantryApi } from "./services/api/pantryApi";

export default function App() {
  const [stage, setStage] = useState("input");
  const [unlockedStage, setUnlockedStage] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [previewRecipe, setPreviewRecipe] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeIngredient, setActiveIngredient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingDetect, setLoadingDetect] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");
  /** Base64 JPEG from /detect/ (bounding boxes); shown in phase 2 */
  const [annotatedImageBase64, setAnnotatedImageBase64] = useState(null);
  /** Latest SSE event from /detect/ while loading */
  const [detectionProgress, setDetectionProgress] = useState(null);
  const fileInputRef = useRef(null);
  const chatStackRef = useRef(null);

  const materials = useMemo(() => getRecipeMaterials(selectedRecipe), [selectedRecipe]);

  const showSidebar = useMemo(() => stage === "execution", [stage]);

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setIngredients([]);
    setRecipes([]);
    setPreviewRecipe(null);
    setSelectedRecipe(null);
    setActiveIngredient(null);
    setChatMessages([]);
    setChatInput("");
    setError("");
    setAnnotatedImageBase64(null);
    setStage("input");
    setUnlockedStage(0);
    runDetect(file);
  };

  const handleOpenIngredient = (item, index) => {
    setActiveIngredient({ ...item, index, isNew: false });
  };

  const handleOpenAddIngredient = () => {
    setActiveIngredient({
      name: "",
      quantity: "",
      condition: "unknown",
      index: -1,
      isNew: true,
    });
  };

  const handleEditIngredientField = (index, field, value) => {
    setActiveIngredient((prev) => {
      if (!prev) return prev;
      if (prev.isNew || index === -1) {
        return { ...prev, [field]: value };
      }
      if (prev.index === index) {
        return { ...prev, [field]: value };
      }
      return prev;
    });
    if (typeof index === "number" && index >= 0) {
      setIngredients((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      );
    }
  };

  const handleSaveNewIngredient = () => {
    setActiveIngredient((current) => {
      if (!current?.isNew) return current;
      const name = current.name?.trim();
      if (!name) return current;
      setIngredients((prev) => [
        ...prev,
        {
          name,
          quantity: (current.quantity || "").trim(),
          condition: current.condition || "unknown",
        },
      ]);
      return null;
    });
  };

  const handleDeleteIngredient = (index) => {
    if (index < 0) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
    setActiveIngredient(null);
  };

  const runDetect = async (fileOverride) => {
    const file = fileOverride || selectedImage;
    if (!file) return;
    setLoadingDetect(true);
    setDetectionProgress({ stage: "reading", message: "Sending image…" });
    setError("");
    try {
      const detected = await pantryApi.detectIngredientsStream(file, (ev) => {
        if (ev.stage === "done") return;
        setDetectionProgress({ stage: ev.stage, message: ev.message ?? "" });
      });
      const list = Array.isArray(detected?.ingredients) ? detected.ingredients : [];
      setIngredients(list);
      setAnnotatedImageBase64(
        typeof detected?.image === "string" ? detected.image : null
      );
      setUnlockedStage(1);
      setStage("synthesis");
    } catch (e) {
      setError(`Detection failed: ${e.message}`);
    } finally {
      setLoadingDetect(false);
      setDetectionProgress(null);
    }
  };

  const runRecipes = async () => {
    if (!ingredients.length) return;
    setLoadingRecipes(true);
    setError("");
    try {
      const generated = await pantryApi.generateRecipes(ingredients);
      const recipeList = Array.isArray(generated) ? generated : [];
      setRecipes(recipeList);
      setPreviewRecipe(null);
      setSelectedRecipe(null);
      setChatInput("");
    } catch (e) {
      setError(`Recipe generation failed: ${e.message}`);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleSelectRecipe = (recipe) => {
    setPreviewRecipe(null);
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
    if (stage !== "execution" || !chatStackRef.current) return;
    chatStackRef.current.scrollTop = chatStackRef.current.scrollHeight;
  }, [chatMessages, loadingChat, stage]);

  return (
    <div className="app-shell">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageSelect}
      />
      <div className="app-menubar">
        <AppHeader />
        <StageNavigation
          stage={stage}
          setStage={setStageWithinProgress}
          unlockedStage={unlockedStage}
        />
      </div>

      <main className="viewport">
        <AnimatePresence mode="wait">
          <StagePanel
            stage={stage}
            fileName={selectedImage?.name}
            ingredients={ingredients}
            annotatedImageBase64={annotatedImageBase64}
            recipes={recipes}
            previewRecipe={previewRecipe}
            selectedRecipe={selectedRecipe}
            chatMessages={chatMessages}
            chatInput={chatInput}
            activeIngredient={activeIngredient}
            loadingDetect={loadingDetect}
            detectionProgress={detectionProgress}
            loadingRecipes={loadingRecipes}
            loadingChat={loadingChat}
            error={error}
            onPickImage={handlePickImage}
            onRunRecipes={runRecipes}
            onSelectRecipe={handleSelectRecipe}
            onPreviewRecipe={setPreviewRecipe}
            onClosePreview={() => setPreviewRecipe(null)}
            onOpenIngredient={handleOpenIngredient}
            onOpenAddIngredient={handleOpenAddIngredient}
            onCloseIngredient={() => setActiveIngredient(null)}
            onSaveNewIngredient={handleSaveNewIngredient}
            onDeleteIngredient={handleDeleteIngredient}
            onEditIngredientField={handleEditIngredientField}
            onChatInputChange={(e) => setChatInput(e.target.value)}
            onSendChat={handleSendChat}
            chatStackRef={chatStackRef}
          />
        </AnimatePresence>
        {false && showSidebar && (
          <DiagnosticSidebar selectedRecipe={selectedRecipe} materials={materials} />
        )}
      </main>
    </div>
  );
}
