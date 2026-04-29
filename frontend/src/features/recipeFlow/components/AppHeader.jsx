import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat } from "lucide-react";

const spring = { type: "spring", stiffness: 420, damping: 30, mass: 0.8 };

const titleVariants = {
  hidden: { opacity: 0, x: -18, filter: "blur(6px)", scale: 0.92 },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", scale: 1 },
  exit:   { opacity: 0, x: -14, filter: "blur(4px)", scale: 0.94 },
};

export default function AppHeader() {
  const [hovered, setHovered] = useState(false);

  return (
    <header className="app-header">
      <div className="brand-hover-zone">
        <motion.span
          className="brand-icon-wrap"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          whileHover={{ scale: 1.22, rotate: -6 }}
          whileTap={{ scale: 0.9, rotate: 8 }}
          transition={spring}
        >
          <ChefHat className="brand-icon-lg icon-active" strokeWidth={1.2} aria-hidden="true" />
        </motion.span>

        <AnimatePresence>
          {hovered && (
            <motion.h1
              key="title"
              className="display-title app-title brand-hover-title"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={spring}
            >
              Michelin <em>Atelier</em>
            </motion.h1>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
