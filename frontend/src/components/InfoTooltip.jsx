import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

const tooltipVariants = {
  hidden:  { opacity: 0, y: 6, scale: 0.92, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, scale: 1,    filter: "blur(0px)" },
};

const transition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] };

export default function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="info-tooltip-anchor"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      role="button"
      aria-label="More info"
    >
      <Info className="info-tooltip-icon" strokeWidth={1.5} aria-hidden="true" />

      <AnimatePresence>
        {visible && (
          <motion.span
            className="info-tooltip-bubble"
            role="tooltip"
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={transition}
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
