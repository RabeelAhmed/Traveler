import React from "react";
import { motion } from "framer-motion";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { MdOutlineModeComment } from "react-icons/md";
import { CiLocationOn } from "react-icons/ci";
import { springPress } from "../utils/motion";

export const JourneyStepNode = ({ step, index, total, onOpenDetail, isLeftAligned }) => {
  const heroImageUrl = step?.media?.[0]?.url;

  return (
    <div className={`flex flex-col md:flex-row w-full items-center relative my-10 ${
      isLeftAligned ? "md:flex-row" : "md:flex-row-reverse"
    }`}>
      {/* Node Content Card */}
      <div className={`w-full md:w-[45%] flex ${
        isLeftAligned ? "justify-end text-right md:pr-12" : "justify-start text-left md:pl-12"
      }`}>
        <motion.div
          whileHover={{ y: -4, shadow: "0 12px 30px rgba(0,0,0,0.06)" }}
          onClick={() => onOpenDetail(step)}
          className="bg-white rounded-3xl border border-sand-200/80 p-5 shadow-[0_8px_30px_rgb(20,41,57,0.02)] cursor-pointer select-none w-full max-w-md transition-all duration-300 hover:border-ocean-200/50"
        >
          {/* Node thumbnail */}
          {heroImageUrl && (
            <div className="w-full h-40 rounded-2xl overflow-hidden mb-4 bg-sand-50 border border-sand-100">
              <img
                src={heroImageUrl}
                alt={step?.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Location pin */}
          <div className={`flex items-center gap-1 text-sand-400 text-[10px] uppercase font-bold tracking-wider mb-2 ${
            isLeftAligned ? "justify-end" : "justify-start"
          }`}>
            <CiLocationOn className="text-sm text-ocean-500 animate-pulse" />
            <span>{step?.location}</span>
          </div>

          {/* Title and Snippet */}
          <h3 className="font-display font-extrabold text-base text-sand-900 mb-2 leading-snug line-clamp-1 hover:text-ocean-600 transition-colors">
            {step?.title}
          </h3>
          <p className="font-sans text-xs text-sand-600 leading-relaxed line-clamp-2 mb-4">
            {step?.description}
          </p>

          {/* Mini Info Footer - Like & Comment Counts */}
          <div className={`flex items-center gap-3 text-sand-400 text-xs ${
            isLeftAligned ? "justify-end" : "justify-start"
          }`}>
            <span className="flex items-center gap-1 bg-sand-50 border border-sand-100 px-2 py-1 rounded-full text-[10px] font-semibold text-sand-500">
              <AiOutlineLike className="text-xs text-ocean-500" />
              {step?.likesCount || 0}
            </span>
            <span className="flex items-center gap-1 bg-sand-50 border border-sand-100 px-2 py-1 rounded-full text-[10px] font-semibold text-sand-500">
              <MdOutlineModeComment className="text-xs text-sand-400" />
              {step?.comments?.length || 0}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Timeline Circle Center Connector */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-ocean-600 border-[3px] border-white shadow-md flex items-center justify-center text-white text-xs font-bold font-sans">
          {index + 1}
        </div>
      </div>

      {/* Spacing for layout symmetry on desktop */}
      <div className="hidden md:block w-[45%]" />
    </div>
  );
};

export default JourneyStepNode;
