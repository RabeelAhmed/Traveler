import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiFolder, FiLock } from "react-icons/fi";
import { fadeUp } from "../utils/motion";

const CollectionCard = ({ collection }) => {
  const navigate = useNavigate();
  const { name, coverImages = [], postCount = 0, posts = [], isPublic, _id } = collection;
  
  const count = postCount || posts.length;

  const handleClick = () => {
    navigate(`/collection/${_id}`);
  };

  // Stacked photo offsets
  const rotationOffsets = ["-rotate-3 translate-x-[-4px]", "-rotate-1 translate-y-[-2px]", "rotate-1 translate-x-[4px]", "rotate-2 translate-y-[2px]"];

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      onClick={handleClick}
      className="bg-white rounded-[32px] border border-sand-150 p-5 shadow-[0_8px_30px_rgb(20,41,57,0.02)] hover:shadow-[0_20px_50px_rgba(65,120,159,0.06)] hover:border-ocean-200/65 transition-all duration-500 cursor-pointer text-left relative overflow-hidden group w-full"
    >
      {/* Visual cover container (stacked photo effect) */}
      <div className="h-40 w-full relative flex items-center justify-center mb-5 select-none bg-sand-50/20 rounded-2xl overflow-hidden border border-dashed border-sand-200/50 p-2">
        {coverImages.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {coverImages.slice(0, 4).map((imgUrl, index) => {
              const rotateClass = rotationOffsets[index % rotationOffsets.length];
              return (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`Cover ${index}`}
                  style={{ zIndex: index + 1 }}
                  className={`absolute w-[80%] h-[90%] object-cover rounded-2xl border-2 border-white shadow-[0_8px_30px_rgba(20,41,57,0.06)] transition-transform duration-500 group-hover:scale-[1.03] ${rotateClass}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sand-50 to-sand-100/80 border border-sand-200 flex items-center justify-center shadow-inner">
            <FiFolder className="text-sand-400 text-2xl group-hover:text-ocean-500 transition-colors duration-300" />
          </div>
        )}
      </div>

      {/* Info Block */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-black text-sm text-sand-800 truncate group-hover:text-ocean-600 transition-colors duration-300">
            {name}
          </h3>
          <p className="font-sans text-[11px] font-bold text-sand-400 mt-1 uppercase tracking-wider">
            {count} {count === 1 ? "post" : "posts"}
          </p>
        </div>
        {!isPublic && (
          <div className="p-1.5 bg-sand-50 rounded-lg border border-sand-100 text-sand-400">
            <FiLock className="text-xs" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CollectionCard;
