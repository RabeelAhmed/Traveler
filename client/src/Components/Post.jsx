import React, { useState } from "react";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { MdOutlineModeComment } from "react-icons/md";
import { CiLocationOn } from "react-icons/ci";
import { FaShare, FaFacebookF, FaTwitter, FaWhatsapp, FaCopy } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ReactStars from "react-rating-stars-component";
import ProfileImage from "./ProfileImage";
import Carousel from "./Carousel";
import { toggleLike } from "../Toolkit/slices/userProfileSlice";
import { likeAndUnlikePost } from "../Toolkit/slices/feedSlice";
import { springPress, scaleIn } from "../utils/motion";
import { HiCheck } from "react-icons/hi";

const Post = ({ post, scrollToComment, openMobileComments }) => {
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const isLoggedIn = useSelector((state) => state.appConfig.isLoggedIn);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(post?.isLikedByUser);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [animateLike, setAnimateLike] = useState(false);

  const postUrl = window.location.href;
  const formattedHashtags = post?.hashtags?.join(" ") || "";

  const handleShareClick = (e) => {
    e.stopPropagation();
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleUserProfile = (e) => {
    e.stopPropagation();
    navigate(`/profile/${post?.owner?._id}`);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }

    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 400);

    dispatch(likeAndUnlikePost({ postId: post.id }));
    dispatch(toggleLike({ postId: post.id, curUserId: myProfile._id }));

    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleTwitterShare = () => {
    const text = "Check out this post!";
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const handleWhatsAppShare = () => {
    const text = "Check out this post!";
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}%20${encodeURIComponent(postUrl)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    if (window.innerWidth < 768) {
      openMobileComments();
    } else {
      scrollToComment();
    }
  };

  const hasMedia = post?.media?.length > 0;

  return (
    <div className="w-full flex flex-col text-left">
      {/* Media Carousel / Hero Element */}
      {hasMedia ? (
        <div className="w-full relative bg-sand-900 group">
          <Carousel data={post.media} />
          
          {/* Floating Glass-Dark Action Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] z-30">
            {/* Like */}
            <motion.button
              {...springPress}
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                isLiked
                  ? "bg-sunset-500/20 border-sunset-500/30 text-sunset-400"
                  : "bg-white/10 border-white/10 text-white/80 hover:text-white"
              }`}
            >
              <motion.div
                animate={animateLike ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                {isLiked ? (
                  <AiFillLike className="text-base text-sunset-400" />
                ) : (
                  <AiOutlineLike className="text-base" />
                )}
              </motion.div>
              <span>{likesCount}</span>
            </motion.button>

            {/* Comment */}
            <motion.button
              {...springPress}
              onClick={handleCommentClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all"
            >
              <MdOutlineModeComment className="text-base" />
              <span>{post.comments?.length || 0}</span>
            </motion.button>

            {/* Share */}
            <motion.button
              {...springPress}
              onClick={handleShareClick}
              className="flex items-center justify-center p-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
            >
              <FaShare className="text-sm" />
            </motion.button>
          </div>
        </div>
      ) : null}

      {/* Post Context Body */}
      <div className="p-6 md:p-8">
        
        {/* User Info (if not inside media, or as secondary header details) */}
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-sand-100">
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
                className="text-sm md:text-base font-sans font-bold text-sand-900 hover:text-ocean-600 cursor-pointer transition-colors"
              >
                {post?.owner?.name}
              </p>
              <p className="text-[11px] font-sans text-sand-400 mt-0.5">
                {post?.timeAgo}
              </p>
            </div>
          </div>

          {/* Action bar fall-back when post has no media */}
          {!hasMedia && (
            <div className="flex items-center gap-2 text-sand-500">
              <motion.button
                {...springPress}
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-300 ${
                  isLiked
                    ? "bg-ocean-50 border-ocean-100 text-ocean-600 shadow-sm"
                    : "bg-sand-50 border-sand-200/80 hover:bg-sand-100 text-sand-500"
                }`}
              >
                <motion.div
                  animate={animateLike ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {isLiked ? (
                    <AiFillLike className="text-base text-ocean-600" />
                  ) : (
                    <AiOutlineLike className="text-base" />
                  )}
                </motion.div>
                <span>{likesCount}</span>
              </motion.button>

              <motion.button
                {...springPress}
                onClick={handleCommentClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sand-200 bg-sand-50 hover:bg-sand-100 text-xs font-semibold transition-all"
              >
                <MdOutlineModeComment className="text-base text-sand-400" />
                <span>{post.comments?.length || 0}</span>
              </motion.button>

              <motion.button
                {...springPress}
                onClick={handleShareClick}
                className="p-2 rounded-full border border-sand-200 bg-sand-50 hover:bg-sand-100 text-sand-400 hover:text-sand-600 transition-all"
              >
                <FaShare className="text-sm" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Text Context Info */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-sand-900 leading-snug mb-3">
            {post?.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <ReactStars
              count={5}
              value={post?.rating}
              edit={false}
              size={18}
              isHalf={true}
              activeColor="#ffd700"
            />
            {formattedHashtags && (
              <>
                <span className="text-sand-300">|</span>
                <span className="text-xs font-semibold text-ocean-600 tracking-tight uppercase">
                  {formattedHashtags}
                </span>
              </>
            )}
          </div>

          <p className="font-sans text-sm md:text-base text-sand-700 leading-relaxed whitespace-pre-line">
            {post?.description}
          </p>
        </div>

        {/* Location Footer Details */}
        <div
          onClick={() => navigate(`/search?query=${encodeURIComponent(post?.location)}`)}
          className="flex items-center gap-1.5 text-sand-500 hover:text-ocean-600 transition-colors cursor-pointer border-t border-sand-50 pt-5"
        >
          <CiLocationOn className="text-lg text-ocean-500 animate-bounce" />
          <span className="text-xs font-semibold tracking-tight uppercase">
            {post?.location}
          </span>
        </div>
      </div>

      {/* Share Popup modal */}
      <AnimatePresence>
        {isPopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ocean-950/20 backdrop-blur-md"
              onClick={handleClosePopup}
            />

            {/* Modal */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_8px_30px_rgb(20,41,57,0.12)] border border-sand-100 z-10 origin-center text-left"
            >
              <h2 className="font-display font-semibold text-xl text-sand-900 mb-4">
                Share this post
              </h2>

              {/* Copy URL Input */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={postUrl}
                  readOnly
                  className="pl-4 pr-10 py-2.5 bg-sand-50 border border-sand-200 rounded-xl text-xs w-full text-sand-600 focus:outline-none focus:ring-1 focus:ring-ocean-300"
                />
                <motion.button
                  {...springPress}
                  onClick={handleCopyClick}
                  className="bg-ocean-600 hover:bg-ocean-700 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center"
                >
                  <FaCopy />
                </motion.button>
              </div>

              {isCopied && (
                <div className="text-jade-600 text-xs font-bold mb-4 pl-1 flex items-center gap-1 animate-pulse">
                  <HiCheck className="text-sm" />
                  <span>URL copied to clipboard!</span>
                </div>
              )}

              {/* Social platform share buttons */}
              <div className="flex gap-3 justify-center mt-5">
                <motion.button
                  {...springPress}
                  onClick={handleFacebookShare}
                  className="w-11 h-11 bg-[#1877F2] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
                >
                  <FaFacebookF className="text-lg" />
                </motion.button>
                <motion.button
                  {...springPress}
                  onClick={handleTwitterShare}
                  className="w-11 h-11 bg-[#1DA1F2] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
                >
                  <FaTwitter className="text-lg" />
                </motion.button>
                <motion.button
                  {...springPress}
                  onClick={handleWhatsAppShare}
                  className="w-11 h-11 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
                >
                  <FaWhatsapp className="text-lg" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Post;
