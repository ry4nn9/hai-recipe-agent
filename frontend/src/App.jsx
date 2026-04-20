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
    setStage("input");
    setUnlockedStage(0);
    runDetect(file);
  };

  const handleOpenIngredient = (item, index) => {
    setActiveIngredient({ ...item, index });
  };

  const handleEditIngredientField = (index, field, value) => {
    setIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setActiveIngredient((prev) =>
      prev && prev.index === index ? { ...prev, [field]: value } : prev
    );
  };

  const runDetect = async (fileOverride) => {
    const file = fileOverride || selectedImage;
    if (!file) return;
    setLoadingDetect(true);
    setError("");
    try {
      const detected = await pantryApi.detectIngredients(file);
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
            recipes={recipes}
            previewRecipe={previewRecipe}
            selectedRecipe={selectedRecipe}
            chatMessages={chatMessages}
            chatInput={chatInput}
            activeIngredient={activeIngredient}
            loadingDetect={loadingDetect}
            loadingRecipes={loadingRecipes}
            loadingChat={loadingChat}
            error={error}
            onPickImage={handlePickImage}
            onRunRecipes={runRecipes}
            onSelectRecipe={handleSelectRecipe}
            onPreviewRecipe={setPreviewRecipe}
            onClosePreview={() => setPreviewRecipe(null)}
            onOpenIngredient={handleOpenIngredient}
            onCloseIngredient={() => setActiveIngredient(null)}
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
