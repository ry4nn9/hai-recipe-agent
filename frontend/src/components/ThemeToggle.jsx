import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "theme";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? saved === "dark" : true; // default: dark
  });

  useEffect(() => {
    if (isDark) {
      delete document.body.dataset.theme;
      localStorage.setItem(STORAGE_KEY, "dark");
    } else {
      document.body.dataset.theme = "light";
      localStorage.setItem(STORAGE_KEY, "light");
    }
  }, [isDark]);

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setIsDark((d) => !d)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark
        ? <Sun  size={18} strokeWidth={1.5} />
        : <Moon size={18} strokeWidth={1.5} />}
    </button>
  );
}
