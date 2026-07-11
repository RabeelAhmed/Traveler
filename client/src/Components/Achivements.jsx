import React from "react";
import { useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import { motion } from "framer-motion";
import { IoLockClosed } from "react-icons/io5";
import { springPress, scaleIn } from "../utils/motion";
import "react-tooltip/dist/react-tooltip.css";

const Achivements = () => {
  const myProfile = useSelector((state) => state.userProfile.user);

  const totalAchievements = [
    {
      id: 1,
      src: "https://res.cloudinary.com/djiqzvcev/image/upload/v1739281946/achivement3_hlkpml.png",
      alt: "first_Step",
      title: "first_Step",
      desc: "Took your first step in traveler forum.",
    },
    {
      id: 2,
      src: "https://res.cloudinary.com/djiqzvcev/image/upload/v1739281968/achivement2_xqn8uc.png",
      alt: "adventurer",
      title: "adventurer",
      desc: "Created 3 Journeys.",
    },
    {
      id: 3,
      src: "https://res.cloudinary.com/djiqzvcev/image/upload/v1739309183/achivement4_xeacf0_c_crop_w_400_h_400_puophi.png",
      alt: "explorer",
      title: "explorer",
      desc: "Created 5 Journeys.",
    },
    {
      id: 4,
      src: "https://res.cloudinary.com/djiqzvcev/image/upload/v1739307386/mountain-and-lake-travel-badge-with-airplane_10964465_tvmfaa.png",
      alt: "Nomad",
      title: "nomad",
      desc: "Shared journeys in 3 different locations.",
    },
    {
      id: 5,
      src: "https://res.cloudinary.com/djiqzvcev/image/upload/v1739307394/pngtree-mountain-summer-time-badge-png-image_11928438_axvgod.png",
      alt: "Nature_Lover",
      title: "Nature_Lover",
      desc: "Posted tag #nature.",
    },
    {
      id: 6,
      src: "https://res.cloudinary.com/djiqzvcev/image/upload/v1739307403/travel-badge-with-forest-lake-mountain-and-beautiful-landscape-_10964474_qagip6.png",
      alt: "Cultural_Traveler",
      title: "Cultural_Traveler",
      desc: "Received 10 likes on a journey.",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-sand-100/80 p-6 shadow-[0_8px_30px_rgb(20,41,57,0.02)] text-left">
      <h3 className="font-display font-semibold text-lg text-sand-900 mb-6">
        Explorer Badges
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
        {totalAchievements.map((achievement) => {
          const hasBadge = myProfile?.badges?.some(
            (badge) => badge.name === achievement.title
          );
          
          const tooltipText = hasBadge
            ? `${achievement.title.replace("_", " ")} - Unlocked! ${achievement.desc}`
            : `${achievement.title.replace("_", " ")} (Locked) - ${achievement.desc}`;

          return (
            <motion.div
              {...springPress}
              key={achievement.id}
              data-tooltip-id="achievements-tooltip"
              data-tooltip-content={tooltipText}
              className={`relative overflow-hidden aspect-square rounded-2xl border transition-all duration-300 cursor-help flex flex-col items-center justify-center p-4 text-center ${
                hasBadge
                  ? "bg-jade-50/20 border-jade-200/80 shadow-[0_8px_20px_rgba(46,189,133,0.08)] hover:shadow-[0_8px_24px_rgba(46,189,133,0.18)] hover:-translate-y-0.5 hover:rotate-1"
                  : "bg-sand-50/50 border-sand-200/80 grayscale opacity-60"
              }`}
            >
              {/* Image */}
              <img
                src={achievement.src}
                alt={achievement.alt}
                className="w-18 h-18 md:w-20 md:h-20 object-contain mb-2"
              />

              {/* Title */}
              <span className="font-display font-bold text-xs md:text-sm text-sand-800 tracking-tight capitalize">
                {achievement.title.replace("_", " ")}
              </span>

              {/* Locked Overlay badge */}
              {!hasBadge && (
                <div className="absolute top-2 right-2 bg-sand-200/80 border border-sand-300 text-sand-500 p-1.5 rounded-full flex items-center justify-center text-xs">
                  <IoLockClosed />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <Tooltip
        id="achievements-tooltip"
        place="top"
        className="font-sans text-xs font-semibold max-w-xs z-50 shadow-md bg-sand-900 text-white rounded-lg p-2.5"
      />
    </div>
  );
};

export default Achivements;
