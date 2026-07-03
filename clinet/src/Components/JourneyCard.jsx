import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { MdOutlineModeComment } from "react-icons/md";
import { CiLocationOn } from "react-icons/ci";
import { motion } from "framer-motion";
import ProfileImage from "./ProfileImage";
import { likeAndUnlikePost } from "../Toolkit/slices/feedSlice";
import { toggleLike } from "../Toolkit/slices/userProfileSlice";
import { springPress, scaleIn, fadeUp } from "../utils/motion";

const JourneyCard = ({ post }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state) => state.appConfig.isLoggedIn);
  const myProfile = useSelector((state) => state.appConfig.myProfile);

  const [isLiked, setIsLiked] = useState(post?.isLikedByUser);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [animateLike, setAnimateLike] = useState(false);

  const openJourney = (e) => {
    e.preventDefault();
    navigate(`/journey/${post?.journeyId}`);
  };

  const handleUserProfile = (e) => {
    e.stopPropagation();
    navigate(`/profile/${post?.owner?._id}`);
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 400);

    dispatch(likeAndUnlikePost({ postId: post.id }));
    dispatch(toggleLike({ postId: post.id, curUserId: myProfile._id }));

    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    navigate(`/journey/${post?.journeyId}`);
  };

  const heroImageUrl = post?.media?.[0]?.url;
  const stopsCount = post?.journeyStepsCount || 1;
  const isActive = post?.journeyIsActive;

  return (
    <div
      onClick={openJourney}
      className="bg-white rounded-[2rem] border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.02)] overflow-visible cursor-pointer hover:shadow-[0_12px_36px_rgb(20,41,57,0.04)] hover:-translate-y-1 transition-all duration-300 mb-8 text-left relative"
    >
      
      {/* Visual Stacked Photo container */}
      {heroImageUrl && (
        <div className="relative w-full h-48 md:h-60 rounded-t-[2rem] overflow-visible">
          {/* Back card 2 */}
          <div className="absolute inset-x-4 top-1.5 bottom-0 bg-sand-200 rounded-[2rem] rotate-2 translate-y-1 opacity-40 shadow-sm" />
          
          {/* Back card 1 */}
          <div className="absolute inset-x-2 top-0.5 bottom-0 bg-sand-300 rounded-[2rem] -rotate-1 translate-y-0.5 opacity-60 shadow-sm" />

          {/* Foreground main card */}
          <div className="absolute inset-0 rounded-t-[2rem] overflow-hidden z-10 border-b border-sand-100/50 shadow-inner bg-sand-100">
            <img
              src={heroImageUrl}
              alt={post?.title}
              className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700 ease-out"
            />

            {/* Journey corner Tag Ribbon */}
            <div className={`absolute top-0 right-0 ${isActive ? 'bg-sunset-500' : 'bg-jade-600'} text-white text-[10px] uppercase font-bold py-1.5 px-4 rounded-bl-2xl shadow-sm z-10 font-sans tracking-widest`}>
              {isActive ? "Ongoing Journey" : "Completed Journey"}
            </div>
          </div>
        </div>
      )}

      <div className="p-5 md:p-6 pt-6 relative z-20">
        
        {/* Step-count badge & travel info */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="border border-ocean-100 rounded-full p-0.5">
              <ProfileImage
                userProfileImage={post?.owner?.avatar?.url}
                userId={post?.owner?._id}
              />
            </div>
            <div>
              <p
                onClick={handleUserProfile}
                className="text-xs md:text-sm font-sans font-bold text-sand-900 hover:text-ocean-600 transition-colors"
              >
                {post?.owner?.name}
              </p>
              <p className="text-[10px] font-sans text-sand-400 mt-0.5">
                Started {post?.timeAgo}
              </p>
            </div>
          </div>

          {/* Likes & Comments Pills */}
          <div className="flex items-center space-x-2 text-sand-500">
            <motion.button
              {...springPress}
              onClick={handleLikeClick}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold tracking-tight transition-all duration-200 ${
                isLiked
                  ? "bg-ocean-50 border-ocean-100 text-ocean-600 shadow-sm"
                  : "bg-sand-50 border-sand-200/80 hover:bg-sand-100 text-sand-500"
              }`}
            >
              <motion.div
                animate={animateLike ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex items-center"
              >
                {isLiked ? (
                  <AiFillLike className="text-sm text-ocean-600" />
                ) : (
                  <AiOutlineLike className="text-sm" />
                )}
              </motion.div>
              <span>{likesCount}</span>
            </motion.button>

            <motion.button
              {...springPress}
              onClick={handleCommentClick}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sand-200/80 bg-sand-50 hover:bg-sand-100 text-[10px] font-semibold tracking-tight transition-all duration-200"
            >
              <motion.div className="flex items-center">
                <MdOutlineModeComment className="text-sm text-sand-400" />
              </motion.div>
              <span>{post?.comments?.length || 0}</span>
            </motion.button>
          </div>
        </div>

        {/* Content text */}
        <div className="mt-4">
          
          {/* Stops summary line */}
          <span className={`inline-block text-[10px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wider mb-2 ${
            isActive 
              ? 'text-sunset-650 bg-sunset-50 border border-sunset-100/50' 
              : 'text-jade-650 bg-jade-50 border border-jade-100/50'
          }`}>
            {isActive ? `Ongoing Journey • ${stopsCount} Stops` : `Completed Journey • ${stopsCount} Stops`}
          </span>

          <h2 className="font-display font-extrabold text-lg md:text-xl text-sand-900 mb-2 leading-snug hover:text-ocean-600 transition-colors">
            {post?.title}
          </h2>
          <p className="font-sans text-xs md:text-sm text-sand-600 leading-relaxed line-clamp-3">
            {post?.description}
          </p>
        </div>

        {/* Footer info & full journey action */}
        <div className="mt-5 pt-4 border-t border-sand-50 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1 text-sand-400">
            <CiLocationOn className="text-base text-ocean-500 animate-pulse" />
            <span className="truncate max-w-[150px] md:max-w-xs">{post?.location}</span>
          </div>
          
          <button
            onClick={openJourney}
            className="text-xs font-bold text-ocean-600 hover:text-ocean-700 uppercase tracking-wider transition-colors select-none focus:outline-none"
          >
            View full journey &rarr;
          </button>
        </div>

      </div>
    </div>
  );
};

export default JourneyCard;
