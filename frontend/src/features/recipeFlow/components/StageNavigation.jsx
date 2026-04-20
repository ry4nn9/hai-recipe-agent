import { STAGES } from "../constants/stages";

export default function StageNavigation({ stage, setStage, unlockedStage }) {
  return (
    <nav className="stage-nav" aria-label="phase navigation">
      {STAGES.map((stageItem, idx) => (
        <button
          key={stageItem.id}
          type="button"
          className={`stage-pill ${stage === stageItem.id ? "is-active" : ""}`}
          disabled={idx > unlockedStage}
          onClick={() => setStage(stageItem.id)}
        >
          <span className="micro-label stage-pill-index">{`0${idx + 1}`}</span>
          <span className="stage-pill-label">{stageItem.label}</span>
        </button>
      ))}
    </nav>
  );
}
