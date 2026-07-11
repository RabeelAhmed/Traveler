import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import notFound from "../assets/Images/404Error.png";

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

export const PageNotFound = () => {
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
          <img src={notFound} alt="Page Not Found" className="w-full h-auto" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="font-display font-extrabold text-3xl md:text-4xl text-sand-900 leading-tight"
        >
          Looks like you're off the map!
        </motion.h1>

        {/* Supporting Line */}
        <motion.p
          variants={itemVariants}
          className="font-sans text-sm md:text-base text-sand-500 leading-relaxed max-w-sm"
        >
          The page you're searching for seems to have vanished into thin air. Let's get you back on track.
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

export default PageNotFound;
