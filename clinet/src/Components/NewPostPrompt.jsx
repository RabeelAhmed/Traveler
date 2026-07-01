import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CiImageOn } from "react-icons/ci";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { springPress } from "../utils/motion";

const NewPostPrompt = () => {
  const navigate = useNavigate();
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const [placeholder, setPlaceholder] = useState("What's new on your Journey?");

  const handleClick = () => {
    navigate("/createpost");
  };

  useEffect(() => {
    const updatePlaceholder = () => {
      if (window.innerWidth < 640) {
        setPlaceholder("What's new?");
      } else {
        setPlaceholder("What's new on your Journey?");
      }
    };

    updatePlaceholder();
    window.addEventListener("resize", updatePlaceholder);

    return () => window.removeEventListener("resize", updatePlaceholder);
  }, []);

  return (
    <motion.div
      {...springPress}
      onClick={handleClick}
      className="flex items-center p-4 cursor-pointer mb-5 rounded-2xl bg-white border border-sand-200/80 shadow-[0_8px_30px_rgb(20,41,57,0.01)] hover:shadow-[0_8px_30px_rgb(20,41,57,0.03)] hover:-translate-y-0.5 transition-all duration-300 select-none text-left"
    >
      {/* Profile Image avatar wrapper */}
      <div className="w-11 h-11 rounded-full border border-sand-100 p-0.5 overflow-hidden flex-shrink-0 bg-sand-50">
        <img
          src={myProfile?.profilePicture?.url}
          alt="User Profile"
          className="w-full h-full rounded-full object-cover"
        />
      </div>

      {/* Input Placeholder */}
      <div className="flex-1 pl-4">
        <span className="text-sand-400 font-sans text-sm md:text-base font-semibold pointer-events-none">
          {placeholder}
        </span>
      </div>

      {/* Icon button */}
      <CiImageOn className="w-9 h-9 md:block hidden text-ocean-600 rounded-xl p-1.5 hover:bg-sand-50 transition-colors" />
    </motion.div>
  );
};

export default NewPostPrompt;
