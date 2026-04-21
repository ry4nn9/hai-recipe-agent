import { motion } from "framer-motion";
import { STAGES } from "../constants/stages";

const pillSpring = { type: "spring", stiffness: 460, damping: 28, mass: 0.85 };

export default function StageNavigation({ stage, setStage, unlockedStage }) {
  return (
    <nav className="stage-nav" aria-label="phase navigation">
      {STAGES.map((stageItem, idx) => {
        const locked = idx > unlockedStage;
        return (
          <motion.button
            key={stageItem.id}
            type="button"
            className={`stage-pill motion-stage-pill ${stage === stageItem.id ? "is-active" : ""}`}
            disabled={locked}
            onClick={() => setStage(stageItem.id)}
            whileHover={locked ? undefined : { scale: 1.04, y: -2 }}
            whileTap={locked ? undefined : { scale: 0.96 }}
            transition={pillSpring}
          >
            <span className="micro-label stage-pill-index">{`0${idx + 1}`}</span>
            <span className="stage-pill-label">{stageItem.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
