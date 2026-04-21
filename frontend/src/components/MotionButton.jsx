import { forwardRef } from "react";
import { motion } from "framer-motion";

const spring = { type: "spring", stiffness: 460, damping: 28, mass: 0.85 };

/**
 * Button with spring hover / tap feedback. Add class `motion-button` for CSS that
 * disables conflicting transform rules on `.action-button`.
 */
const MotionButton = forwardRef(function MotionButton(
  { className, disabled, type = "button", children, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      className={[className, "motion-button"].filter(Boolean).join(" ")}
      disabled={disabled}
      whileHover={
        disabled
          ? undefined
          : { scale: 1.03, y: -2, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }
      }
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={spring}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

export default MotionButton;
