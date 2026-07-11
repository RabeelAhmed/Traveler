import React from "react";
import { motion } from "framer-motion";
import { springPress } from "../utils/motion";

const StepperControl = ({ currentStep, setCurrentStep, handleNext }) => {
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex justify-between items-center mt-8 mb-4 px-2 w-full gap-4">
      {/* Back button */}
      <button
        onClick={handleBack}
        className={`px-5 py-2.5 border border-sand-300 hover:border-sand-400 text-sand-600 hover:text-sand-800 bg-transparent rounded-xl font-semibold transition-all duration-200 text-sm uppercase tracking-wide ${
          currentStep === 1 ? "invisible pointer-events-none" : "visible"
        }`}
      >
        Back
      </button>

      {/* Next button */}
      <motion.button
        {...springPress}
        onClick={handleNext}
        className={`px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl font-semibold text-sm uppercase tracking-wide shadow-[0_4px_12px_rgba(65,120,159,0.15)] transition-all ${
          currentStep === 3 ? "invisible pointer-events-none" : "visible"
        }`}
      >
        Next
      </motion.button>
    </div>
  );
};

export default StepperControl;
