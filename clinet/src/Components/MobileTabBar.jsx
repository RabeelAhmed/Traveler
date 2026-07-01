import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { springPress } from "../utils/motion";
import {
  HiOutlineHome,
  HiHome,
  HiOutlineSearch,
  HiSearch,
  HiOutlineChat,
  HiChat,
  HiPlus,
} from "react-icons/hi";

const MobileTabBar = () => {
  const location = useLocation();
  const isLoggedIn = useSelector((state) => state.appConfig.isLoggedIn);
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const userId = myProfile?._id;

  if (!isLoggedIn) return null;

  const tabItems = [
    {
      path: "/home",
      label: "Home",
      outlineIcon: HiOutlineHome,
      solidIcon: HiHome,
    },
    {
      path: "/search",
      label: "Search",
      outlineIcon: HiOutlineSearch,
      solidIcon: HiSearch,
    },
    {
      path: "/story",
      label: "Story",
      isFAB: true,
    },
    {
      path: "/forum",
      label: "Forum",
      outlineIcon: HiOutlineChat,
      solidIcon: HiChat,
    },
    {
      path: `/profile/${userId}`,
      label: "Profile",
      isProfile: true,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-light border-t border-sand-200/80 px-6 pb-5 pt-2 shadow-[0_-8px_30px_rgb(20,41,57,0.06)]">
      <div className="flex justify-between items-center relative">
        {tabItems.map((tab, index) => {
          const isActive = location.pathname === tab.path;

          if (tab.isFAB) {
            return (
              <div key={index} className="relative -top-5 flex flex-col items-center">
                <Link to={tab.path}>
                  <motion.div
                    {...springPress}
                    className="w-14 h-14 bg-sunset-500 hover:bg-sunset-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(241,102,58,0.3)] border-4 border-sand-50"
                  >
                    <HiPlus className="text-2xl" />
                  </motion.div>
                </Link>
                <span className="text-[10px] font-sans font-medium text-sand-500 mt-1">
                  {tab.label}
                </span>
              </div>
            );
          }

          const IconComponent = isActive ? tab.solidIcon : tab.outlineIcon;

          return (
            <motion.div
              key={index}
              {...springPress}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <Link
                to={tab.path}
                className="flex flex-col items-center justify-center relative w-full h-full"
              >
                {tab.isProfile ? (
                  <img
                    src={myProfile?.profilePicture?.url || ""}
                    alt="User"
                    className={`w-7 h-7 object-cover rounded-full border-2 transition-all duration-300 ${
                      isActive ? "border-ocean-600 scale-105" : "border-sand-300"
                    }`}
                  />
                ) : (
                  <IconComponent
                    className={`text-2xl transition-all duration-300 ${
                      isActive ? "text-ocean-600 scale-105" : "text-sand-400 hover:text-sand-600"
                    }`}
                  />
                )}
                <span
                  className={`text-[10px] mt-1 font-sans font-semibold tracking-tight transition-colors duration-300 ${
                    isActive ? "text-ocean-600" : "text-sand-500"
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="w-1.5 h-1.5 bg-ocean-600 rounded-full absolute -bottom-2"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabBar;
