"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StartSequenceProps {
  onComplete: () => void;
}

const COUNTDOWN_STEPS = [
  { text: "RACE PROTOCOL ACTIVE", duration: 1000 },
  { text: "3", duration: 700 },
  { text: "2", duration: 700 },
  { text: "1", duration: 700 },
  { text: "GO", duration: 500 },
];

export default function StartSequence({ onComplete }: StartSequenceProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= COUNTDOWN_STEPS.length) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setStep((prev) => prev + 1);
    }, COUNTDOWN_STEPS[step].duration);

    return () => clearTimeout(timer);
  }, [step, onComplete]);

  const currentStep = COUNTDOWN_STEPS[step];
  if (!currentStep) return null;

  const isNumber = /^\d$/.test(currentStep.text);
  const isGo = currentStep.text === "GO";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: isNumber ? 1.8 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{
            duration: isNumber ? 0.25 : 0.3,
            ease: "easeOut",
          }}
          className="text-center uppercase"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "0.15em",
            ...(isGo
              ? { fontSize: "4rem", color: "#e8a430", fontWeight: 700 }
              : isNumber
                ? { fontSize: "6rem", color: "#d4d4d8", fontWeight: 600 }
                : {
                    fontSize: "0.85rem",
                    color: "#8a8a96",
                    letterSpacing: "0.25em",
                  }),
          }}
        >
          {currentStep.text}
        </motion.div>
      </AnimatePresence>

      {/* Flash on numbers */}
      {isNumber && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0.6 }}
          animate={{ scaleX: [0, 1, 0], opacity: [0.6, 0.3, 0] }}
          transition={{ duration: 0.3 }}
          className="absolute left-1/4 right-1/4 top-1/2 h-px -translate-y-1/2"
          style={{ background: "#e8a430" }}
        />
      )}
    </div>
  );
}
