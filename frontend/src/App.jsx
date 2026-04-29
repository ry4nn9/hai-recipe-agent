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
import ThemeToggle from "./components/ThemeToggle";

async function convertToRgbUpload(file) {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to decode selected image."));
      img.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable.");
    }
    // Drawing onto a canvas normalizes source pixels to RGB.
    ctx.drawImage(image, 0, 0);

    const jpegBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to encode image as JPEG."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.92
      );
    });

    const rgbFileName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([jpegBlob], rgbFileName, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function App() {
  const [stage, setStage] = useState("input");
  const [unlockedStage, setUnlockedStage] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [previewRecipe, setPreviewRecipe] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeIngredient, setActiveIngredient] = useState(null);
  // Per-recipe chat histories keyed by recipe title
  const [chatHistories, setChatHistories] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [loadingDetect, setLoadingDetect] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");
  /** Base64 JPEG from /detect/ (bounding boxes); shown in phase 2 */
  const [annotatedImageBase64, setAnnotatedImageBase64] = useState(null);
  /** Normalized overlay boxes for interactive preview. */
  const [detectionOverlayItems, setDetectionOverlayItems] = useState([]);
  /** Latest SSE event from /detect/ while loading */
  const [detectionProgress, setDetectionProgress] = useState(null);
  const fileInputRef = useRef(null);
  const chatStackRef = useRef(null);

  const materials = useMemo(() => getRecipeMaterials(selectedRecipe), [selectedRecipe]);

  // Chat messages for the currently selected recipe
  const chatMessages = selectedRecipe ? (chatHistories[selectedRecipe.title] ?? []) : [];

  const showSidebar = useMemo(() => stage === "execution", [stage]);

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (event) => {
    const sourceFile = event.target.files?.[0];
    if (!sourceFile) return;

    let file = sourceFile;
    try {
      file = await convertToRgbUpload(sourceFile);
    } catch (e) {
      setError(`Upload conversion failed: ${e.message}`);
      return;
    }

    setSelectedImage(file);
    setIngredients([]);
    setRecipes([]);
    setPreviewRecipe(null);
    setSelectedRecipe(null);
    setActiveIngredient(null);
    setChatHistories({});
    setChatInput("");
    setError("");
    setAnnotatedImageBase64(null);
    setDetectionOverlayItems([]);
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
    setDetectionProgress({ stage: "reading", message: "Reading image..." });
    setError("");
    setDetectionOverlayItems([]);
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
      setDetectionOverlayItems(
        Array.isArray(detected?.overlayItems) ? detected.overlayItems : []
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
    // Only initialise the chat if this recipe has never been opened before
    setChatHistories((prev) => {
      if (prev[recipe.title]) return prev;
      return {
        ...prev,
        [recipe.title]: [
          {
            role: "agent",
            text: `Great choice. We'll cook "${recipe.title}" one step at a time. Tell me when you're ready to start prep.`,
          },
        ],
      };
    });
    setChatInput("");
    setError("");
  };

  const handleSendChat = async (event) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || !selectedRecipe) return;

    const key = selectedRecipe.title;
    const current = chatHistories[key] ?? [];
    const nextHistory = [...current, { role: "user", text: message }];

    setChatHistories((prev) => ({ ...prev, [key]: nextHistory }));
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

      setChatHistories((prev) => ({
        ...prev,
        [key]: [
          ...(prev[key] ?? []),
          {
            role: "agent",
            text: response.reply || "Let's continue. What's your current step?",
          },
        ],
      }));
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
      <div className="app-canvas">
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
              detectionOverlayItems={detectionOverlayItems}
              recipes={recipes}
              previewRecipe={previewRecipe}
              selectedRecipe={selectedRecipe}
              chatMessages={chatMessages}
              chatHistories={chatHistories}
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
      <ThemeToggle />
    </div>
  );
}
