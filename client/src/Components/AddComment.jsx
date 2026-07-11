import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { HiCheck } from "react-icons/hi";
import ProfileImage from "./ProfileImage";
import { addComment } from "../Toolkit/slices/feedSlice";
import { springPress, scaleIn } from "../utils/motion";

const AddComment = ({ postId }) => {
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [commentText, setCommentText] = useState("");
  const [success, setSuccess] = useState(false);

  const commentHandler = (e) => {
    e.preventDefault();

    if (myProfile) {
      if (!commentText.trim()) {
        console.warn("Comment cannot be empty");
        return;
      }

      try {
        dispatch(addComment({ postId, commentText }));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 1500);
      } catch (error) {
        console.error("Failed to add comment:", error);
      }

      setCommentText("");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="w-full bg-white py-4 mb-4 border-b border-sand-100/50 text-left">
      <div className="flex items-center space-x-3 mb-4">
        <div className="border border-sand-100 rounded-full p-0.5">
          <ProfileImage
            userProfileImage={myProfile?.profilePicture?.url}
            userId={myProfile?._id}
          />
        </div>
        <div>
          <p className="text-sm font-sans font-bold text-sand-800">
            {myProfile?.fullname || "User"}
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="flex flex-col gap-2">
        <textarea
          placeholder="Write a comment..."
          className="w-full p-3 bg-sand-50/50 border border-sand-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white text-sand-800 placeholder:text-sand-400 font-sans text-xs md:text-sm h-18 resize-none transition-all"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />

        <div className="flex justify-end">
          <motion.button
            {...springPress}
            type="button"
            className={`px-6 py-2 rounded-xl font-semibold text-xs transition-colors duration-200 flex items-center justify-center min-w-28 ${
              success
                ? "bg-jade-600 text-white"
                : "bg-ocean-600 hover:bg-ocean-700 text-white shadow-sm"
            }`}
            onClick={commentHandler}
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="flex items-center gap-1"
                >
                  <HiCheck className="text-base text-white animate-bounce" />
                  <span>Commented!</span>
                </motion.div>
              ) : (
                <span key="idle">Comment</span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AddComment;
