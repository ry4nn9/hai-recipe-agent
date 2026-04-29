import { useState, useEffect } from "react";

const PALETTES = [
  { id: "ocean",    label: "Ocean"    },
  { id: "slate",    label: "Slate"    },
  { id: "forest",   label: "Forest"   },
  { id: "ember",    label: "Ember"    },
  { id: "rose",     label: "Rose"     },
  { id: "obsidian", label: "Obsidian" },
];

const STORAGE_KEY = "palette";

export default function PaletteSwitcher() {
  const [active, setActive] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "ocean"
  );

  useEffect(() => {
    if (active === "ocean") {
      delete document.body.dataset.palette;
      localStorage.removeItem(STORAGE_KEY);
    } else {
      document.body.dataset.palette = active;
      localStorage.setItem(STORAGE_KEY, active);
    }
  }, [active]);

  return (
    <div className="palette-switcher" role="group" aria-label="Color palette">
      {PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`palette-swatch palette-swatch--${p.id}${active === p.id ? " is-active" : ""}`}
          title={p.label}
          aria-label={p.label}
          aria-pressed={active === p.id}
          onClick={() => setActive(p.id)}
        />
      ))}
    </div>
  );
}
