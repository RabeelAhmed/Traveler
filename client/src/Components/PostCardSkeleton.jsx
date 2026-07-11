import React from "react";
import { motion } from "framer-motion";

const PostCardSkeleton = () => {
  return (
    <div className="bg-white rounded-3xl border border-sand-100 p-5 md:p-6 mb-4 shadow-[0_8px_30px_rgb(20,41,57,0.02)] overflow-hidden relative">
      {/* Infinite Framer Motion Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-sand-200/40 to-transparent z-10"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
      />

      {/* Header Profile Info placeholder */}
      <div className="flex items-center space-x-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-sand-100" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-1/4 bg-sand-100 rounded" />
          <div className="h-3 w-1/6 bg-sand-50 rounded" />
        </div>
      </div>

      {/* Content lines */}
      <div className="space-y-2 mb-4">
        <div className="h-5 w-2/3 bg-sand-100 rounded" />
        <div className="h-4 w-full bg-sand-50 rounded" />
        <div className="h-4 w-5/6 bg-sand-50 rounded" />
      </div>

      {/* Hero Image placeholder */}
      <div className="w-full h-44 bg-sand-100/60 rounded-2xl mb-4" />

      {/* Footer tags & likes */}
      <div className="flex items-center justify-between pt-4 border-t border-sand-50">
        <div className="h-4 w-1/4 bg-sand-50 rounded" />
        <div className="flex gap-3">
          <div className="h-8 w-12 bg-sand-100 rounded-full" />
          <div className="h-8 w-12 bg-sand-100 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default PostCardSkeleton;
