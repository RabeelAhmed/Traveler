import React from "react";
import { motion } from "framer-motion";
import { fadeUp } from "../utils/motion";

const Header = ({ title, subtitle }) => {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="mt-16 bg-white border-b border-sand-100 py-6 px-6 md:px-12 text-left"
    >
      <div className="max-w-7xl mx-auto">
        {title && (
          <h1 className="font-display font-bold text-3xl md:text-4xl text-sand-900 tracking-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="font-sans text-sm text-sand-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default Header;

