import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CgChevronLeft, CgChevronRight } from "react-icons/cg";

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    zIndex: 1,
    transition: {
      x: { type: "spring", stiffness: 280, damping: 28 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.3 },
    },
  },
  exit: (direction) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.96,
    zIndex: 0,
    transition: {
      x: { type: "spring", stiffness: 280, damping: 28 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.3 },
    },
  }),
};

const Carousel = ({ data }) => {
  const slides = data || [];
  const [[page, direction], setPage] = useState([0, 0]);

  if (slides.length === 0) return null;

  // Wrap index to bounds
  const currentIndex = ((page % slides.length) + slides.length) % slides.length;

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
  };

  return (
    <div className="relative w-full h-64 md:h-96 lg:h-[500px] overflow-hidden bg-sand-900 select-none">
      
      {/* Slide Content wrapper */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={page}
            src={slides[currentIndex]?.url}
            alt={`Slide ${currentIndex + 1}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Slide Navigation & Controls */}
      {slides.length > 1 && (
        <>
          {/* Arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 inset-x-4 flex justify-between z-20 pointer-events-none">
            <button
              onClick={() => paginate(-1)}
              className="bg-black/40 backdrop-blur-sm border border-white/10 text-white p-2.5 rounded-full hover:bg-black/60 active:scale-95 transition-all pointer-events-auto focus:outline-none"
            >
              <CgChevronLeft size={24} />
            </button>
            <button
              onClick={() => paginate(1)}
              className="bg-black/40 backdrop-blur-sm border border-white/10 text-white p-2.5 rounded-full hover:bg-black/60 active:scale-95 transition-all pointer-events-auto focus:outline-none"
            >
              <CgChevronRight size={24} />
            </button>
          </div>

          {/* Dots Indicators */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex space-x-1.5 z-25">
            {slides.map((_, index) => (
              <div
                key={index}
                onClick={() => {
                  const diff = index - currentIndex;
                  if (diff !== 0) {
                    paginate(diff);
                  }
                }}
                className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-white w-4"
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Carousel;