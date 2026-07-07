import React from "react";
import { motion } from "framer-motion";
import { AiOutlineLike } from "react-icons/ai";
import { MdOutlineModeComment } from "react-icons/md";
import { CiLocationOn } from "react-icons/ci";
import { HiStar } from "react-icons/hi";
import { springPress } from "../utils/motion";

export const JourneyStepNode = ({ step, index, total, onOpenDetail, isLeftAligned }) => {
  const heroImageUrl = step?.media?.[0]?.url;

  return (
    <div className={`flex flex-col md:flex-row w-full items-center relative my-12 ${
      isLeftAligned ? "md:flex-row" : "md:flex-row-reverse"
    }`}>
      {/* Node Content Card */}
      <div className={`w-full md:w-[45%] flex ${
        isLeftAligned ? "justify-end text-right md:pr-14" : "justify-start text-left md:pl-14"
      }`}>
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          onClick={() => onOpenDetail(step)}
          className="bg-white rounded-[32px] border border-sand-150 p-6 shadow-[0_12px_40px_rgba(20,41,57,0.03)] hover:shadow-[0_20px_50px_rgba(65,120,159,0.08)] cursor-pointer select-none w-full max-w-md transition-all duration-500 hover:border-ocean-300/60 relative overflow-hidden group"
        >
          {/* Subtle top color bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-ocean-500 to-ocean-400 group-hover:from-ocean-600 group-hover:to-ocean-500 transition-colors" />

          {/* Node thumbnail */}
          {heroImageUrl && (
            <div className="w-full h-44 rounded-2xl overflow-hidden mb-4 bg-sand-50 border border-sand-100/80 relative shadow-sm">
              <img
                src={heroImageUrl}
                alt={step?.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              
              {/* Floating Stop Badge */}
              <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                Stop {index + 1}
              </div>
            </div>
          )}

          {/* Location & Rating Header Row */}
          <div className={`flex items-center gap-3 mb-2.5 ${
            isLeftAligned ? "justify-end" : "justify-start"
          }`}>
            {/* Location pin */}
            <div className="flex items-center gap-1 text-ocean-600 text-[10px] uppercase font-black tracking-widest bg-ocean-50/50 border border-ocean-100/30 px-2.5 py-1 rounded-lg">
              <CiLocationOn className="text-xs font-black animate-pulse" />
              <span>{step?.location}</span>
            </div>

            {/* Rating Stars */}
            {step?.rating != null && (
              <div className="flex items-center gap-0.5 bg-amber-50/70 border border-amber-100/50 px-2 py-1 rounded-lg">
                <span className="text-[9px] font-black text-amber-800">{step.rating}</span>
                <HiStar className="text-[10px] text-amber-500" />
              </div>
            )}
          </div>

          {/* Title and Snippet */}
          <h3 className="font-display font-black text-base text-sand-900 mb-2 leading-snug group-hover:text-ocean-600 transition-colors">
            {step?.title}
          </h3>
          <p className="font-sans text-xs text-sand-500 leading-relaxed line-clamp-2 mb-4">
            {step?.description}
          </p>

          {/* Divider line */}
          <div className="h-px bg-sand-100 w-full mb-4 opacity-70" />

          {/* Mini Info Footer - Like & Comment Counts */}
          <div className={`flex items-center gap-2 text-sand-400 text-xs ${
            isLeftAligned ? "justify-end" : "justify-start"
          }`}>
            <span className="flex items-center gap-1 bg-gradient-to-br from-sand-50 to-sand-100/40 border border-sand-150 px-3 py-1 rounded-xl text-[10px] font-bold text-sand-600 hover:bg-ocean-50 hover:text-ocean-700 transition-colors">
              <AiOutlineLike className="text-xs text-ocean-500" />
              <span>{step?.likesCount || 0} Likes</span>
            </span>
            <span className="flex items-center gap-1 bg-gradient-to-br from-sand-50 to-sand-100/40 border border-sand-150 px-3 py-1 rounded-xl text-[10px] font-bold text-sand-600">
              <MdOutlineModeComment className="text-xs text-sand-400" />
              <span>{step?.comments?.length || 0} Comments</span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* Timeline Circle Center Connector */}
      <div className="absolute left-6 md:left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
        {/* Glowing backdrop shadow */}
        <div className="absolute w-12 h-12 rounded-full bg-ocean-500/20 blur-sm scale-110 animate-pulse" />
        
        {/* Core Timeline Circle */}
        <motion.div
          whileHover={{ scale: 1.15 }}
          className="relative w-10 h-10 rounded-full bg-gradient-to-br from-ocean-500 via-ocean-600 to-ocean-700 border-[3px] border-white shadow-[0_4px_15px_rgba(65,120,159,0.35)] flex items-center justify-center text-white text-xs font-black font-sans z-10 transition-transform duration-300"
        >
          {index + 1}
        </motion.div>
      </div>

      {/* Spacing for layout symmetry on desktop */}
      <div className="hidden md:block w-[45%]" />
    </div>
  );
};

export default JourneyStepNode;
