import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import pana from "../assets/Images/Underconstruction-pana1.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

const UnderConstruction = () => {
  return (
    <div className="bg-sand-50 min-h-screen w-full flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center max-w-md mx-auto gap-6"
      >
        {/* Floating Illustration */}
        <motion.div
          variants={itemVariants}
          animate={{ y: [0, -12, 0] }}
          transition={{
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="w-72 md:w-80 select-none pointer-events-none"
        >
          <img src={pana} alt="Under Construction" className="w-full h-auto" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="font-display font-extrabold text-3xl md:text-4xl text-sand-900 leading-tight"
        >
          Paving new roads...
        </motion.h1>

        {/* Supporting Line */}
        <motion.p
          variants={itemVariants}
          className="font-sans text-sm md:text-base text-sand-500 leading-relaxed max-w-sm"
        >
          Our team of digital guides is busy building this trail. Let's head back to civilization for now.
        </motion.p>

        {/* Action Button */}
        <motion.div variants={itemVariants} className="mt-2">
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3.5 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors focus:outline-none"
            >
              Back to Traveler
            </motion.button>
          </Link>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default UnderConstruction;
