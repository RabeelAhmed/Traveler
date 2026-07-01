import React from "react";
import { motion } from "framer-motion";

export const JourneyComposerToggle = ({ value, onChange }) => {
  return (
    <div className="flex bg-sand-100 p-1.5 rounded-xl max-w-[280px] mx-auto select-none relative mb-6">
      {[
        { id: "post", label: "Normal Post" },
        { id: "journey", label: "Start Journey" },
      ].map((item) => {
        const isActive = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`relative z-10 flex-1 py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors focus:outline-none ${
              isActive ? "text-white" : "text-sand-500 hover:text-sand-700"
            }`}
          >
            {item.label}
            {isActive && (
              <motion.div
                layoutId="composer-toggle-pill"
                className="absolute inset-0 bg-ocean-600 rounded-lg -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default JourneyComposerToggle;
