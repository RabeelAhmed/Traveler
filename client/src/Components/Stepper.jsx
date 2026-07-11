import React from "react";
import { motion } from "framer-motion";

const Stepper = ({ steps, currentStep }) => {
  // progress fraction: step 1 is 0%, step 2 is 50%, step 3 is 100%
  const progressFraction = (currentStep - 1) / (steps.length - 1);

  return (
    <div className="relative flex justify-between items-center w-full my-8 px-4">
      {/* Background track line */}
      <div className="absolute top-[22px] left-12 right-12 h-[2px] bg-sand-200 -z-0" />

      {/* Animated active filled track line */}
      <motion.div
        className="absolute top-[22px] left-12 right-12 h-[2px] bg-ocean-600 z-0 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progressFraction }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />

      {steps.map((step, index) => {
        const isCompleted = index < currentStep - 1;
        const isHighlighted = index === currentStep - 1;
        const isSelected = index < currentStep;

        return (
          <div key={index} className="flex flex-col items-center relative z-10 w-24">
            <motion.div
              className={`rounded-full h-11 w-11 flex items-center justify-center font-semibold text-sm transition-all duration-300 border-2 ${
                isHighlighted
                  ? "border-ocean-600 bg-white text-ocean-600 shadow-[0_0_0_4px_rgba(65,120,159,0.1)] font-bold scale-105"
                  : isCompleted
                    ? "border-ocean-600 bg-ocean-600 text-white"
                    : isSelected
                      ? "border-ocean-600 bg-ocean-600 text-white"
                      : "border-sand-200 bg-white text-sand-400"
              }`}
            >
              {index + 1}
            </motion.div>
            <span
              className={`text-[10px] font-sans font-bold tracking-tight uppercase mt-3 text-center transition-colors duration-300 ${
                isHighlighted ? "text-ocean-600" : isSelected ? "text-sand-700" : "text-sand-400"
              }`}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
