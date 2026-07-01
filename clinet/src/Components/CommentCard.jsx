import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import ProfileImage from "./ProfileImage";
import { fadeUp } from "../utils/motion";

const CommentCard = ({ comment }) => {
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const navigate = useNavigate();

  const handleUserProfile = () => {
    navigate(`/profile/${comment?.userId}`);
  };

  return (
    <motion.div
      variants={fadeUp}
      className="border-b border-sand-100/50 py-5 px-0 md:px-4 text-left"
    >
      <div className="flex items-center justify-between mb-3">
        {/* User Information */}
        <div className="flex items-center space-x-3">
          <div className="border border-sand-100 rounded-full p-0.5">
            <ProfileImage userProfileImage={comment.userProfileImage} userId={comment.userId} />
          </div>
          <div>
            <p
              className="text-sm font-sans font-bold text-sand-800 cursor-pointer hover:text-ocean-600 transition-colors"
              onClick={handleUserProfile}
            >
              {comment.commentUserName}
            </p>
            <p className="text-[10px] font-sans text-sand-400 mt-0.5">
              {comment.commentedAt}
            </p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs md:text-sm font-sans text-sand-600 leading-relaxed pl-12">
          {comment.commentText}
        </p>
      </div>
    </motion.div>
  );
};

export default CommentCard;
