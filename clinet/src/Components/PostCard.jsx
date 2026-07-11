import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { MdOutlineModeComment } from "react-icons/md";
import { CiLocationOn } from "react-icons/ci";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { FiFolderPlus } from "react-icons/fi";
import { motion } from "framer-motion";
import ProfileImage from "./ProfileImage";
import JourneyCard from "./JourneyCard";
import AddToCollectionModal from "./AddToCollectionModal";
import { likeAndUnlikePost } from "../Toolkit/slices/feedSlice";
import { toggleLike } from "../Toolkit/slices/userProfileSlice";
import { toggleBookmark } from "../Toolkit/slices/bookmarkSlice";
import { springPress } from "../utils/motion";

const PostCard = ({ post }) => {
  if (post?.journeyId && post?.stepIndex === 0) {
    return <JourneyCard post={post} />;
  }

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state) => state.appConfig.isLoggedIn);
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const savedPostIds = useSelector((state) => state.bookmark?.savedPostIds) || [];
  const liveUsers = useSelector((state) => state.live.liveUsers) || {};
  const isSaved = savedPostIds.includes(post?.id);

  const [isLiked, setIsLiked] = useState(post?.isLikedByUser);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [animateLike, setAnimateLike] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const openPost = (e) => {
    e.preventDefault();
    navigate(`/post/${post?.id}`);
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate("/login", { state: { from: location } });
      return;
    }
    dispatch(toggleBookmark(post.id));
  };

  const handleCollectionClick = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setShowCollectionModal(true);
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

    // Toggle local state for instant visual feedback
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    navigate(`/post/${post?.id}`);
  };

  const heroImageUrl = post?.media?.[0]?.url;

  return (
    <div
      onClick={openPost}
      className="bg-white rounded-3xl border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.02)] overflow-hidden cursor-pointer hover:shadow-[0_8px_30px_rgb(20,41,57,0.04)] hover:-translate-y-0.5 transition-all duration-300 mb-6 text-left"
    >
      {/* Hero Image at the top, full-bleed */}
      {heroImageUrl && (
        <div className="w-full h-48 md:h-64 overflow-hidden relative">
          <img
            src={heroImageUrl}
            alt={post?.title}
            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700 ease-out"
          />
        </div>
      )}

      <div className="p-5 md:p-6">
        {/* User Info and Interaction Icons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="border border-ocean-100 rounded-full p-0.5 relative">
              <ProfileImage
                userProfileImage={post?.owner?.avatar?.url}
                userId={post?.owner?._id}
              />
              {liveUsers[post?.owner?._id] && (
                <span className="absolute bottom-0.5 right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sunset-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sunset-500 border border-white"></span>
                </span>
              )}
            </div>
            <div>
              <p
                onClick={handleUserProfile}
                className="text-sm md:text-base font-sans font-bold text-sand-900 hover:text-ocean-600 transition-colors"
              >
                {post?.owner?.name}
              </p>
              <p className="text-[11px] font-sans text-sand-400 mt-0.5">
                {post?.timeAgo}
              </p>
            </div>
          </div>

          {/* Likes & Comments Pills */}
          <div className="flex items-center space-x-2 text-sand-500">
            {/* Like button */}
            <motion.button
              {...springPress}
              onClick={handleLikeClick}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-tight transition-all duration-200 ${
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
                  <AiFillLike className="text-base text-ocean-600" />
                ) : (
                  <AiOutlineLike className="text-base" />
                )}
              </motion.div>
              <span>{likesCount}</span>
            </motion.button>

            {/* Comment button */}
            <motion.button
              {...springPress}
              onClick={handleCommentClick}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sand-200/80 bg-sand-50 hover:bg-sand-100 text-xs font-semibold tracking-tight transition-all duration-200"
            >
              <MdOutlineModeComment className="text-base text-sand-400" />
              <span>{post?.comments?.length || 0}</span>
            </motion.button>

            {/* Bookmark button */}
            <motion.button
              {...springPress}
              onClick={handleBookmarkClick}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-tight transition-all duration-200 ${
                isSaved
                  ? "bg-ocean-50 border-ocean-100 text-ocean-600 shadow-sm"
                  : "bg-sand-50 border-sand-200/80 hover:bg-sand-100 text-sand-500"
              }`}
            >
              <div className="flex items-center">
                {isSaved ? (
                  <BsBookmarkFill className="text-base text-ocean-600" />
                ) : (
                  <BsBookmark className="text-base text-sand-400" />
                )}
              </div>
            </motion.button>

            {/* Add to Collection button */}
            <motion.button
              {...springPress}
              onClick={handleCollectionClick}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sand-200/80 bg-sand-50 hover:bg-sand-100 text-xs font-semibold tracking-tight transition-all duration-200 text-sand-500 hover:text-ocean-600"
            >
              <FiFolderPlus className="text-base" />
            </motion.button>
          </div>
        </div>

        {/* Post Title & Description */}
        <div className="mt-4">
          {post?.journeyId && (
            <span className={`inline-block text-[10px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wider mb-2 ${
              post?.journeyIsActive 
                ? 'text-sunset-650 bg-sunset-50 border border-sunset-100/50' 
                : 'text-jade-650 bg-jade-50 border border-jade-100/50'
            }`}>
              {post?.journeyIsActive 
                ? `Ongoing Journey • Stop ${post?.stepIndex + 1}` 
                : `Completed Journey • Stop ${post?.stepIndex + 1}`}
            </span>
          )}
          <h2 className="font-display font-semibold text-lg md:text-xl text-sand-900 mb-2 hover:text-ocean-600 transition-colors line-clamp-2 leading-snug">
            {post?.title}
          </h2>
          <p className="font-sans text-xs md:text-sm text-sand-600 leading-relaxed line-clamp-3">
            {post?.description}
          </p>
        </div>

        {/* Location Info */}
        <div className="mt-5 flex items-center gap-1.5 text-sand-400 border-t border-sand-50 pt-4">
          <CiLocationOn className="text-base text-ocean-500" />
          <span className="text-xs font-semibold tracking-tight truncate hover:text-ocean-600 transition-colors">
            {post?.location}
          </span>
        </div>
      </div>

      {/* Add To Collection Modal Popup */}
      <AddToCollectionModal
        postId={post?.id}
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
      />
    </div>
  );
};

export default PostCard;
