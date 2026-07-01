import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaUserEdit, FaShare, FaFacebookF, FaTwitter, FaWhatsapp, FaCopy } from "react-icons/fa";
import { HiCheck } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import {
  followAndUnfollowUser,
  getUserProfile,
  resetProfile,
} from "../Toolkit/slices/userProfileSlice";
import NewPostPrompt from "../Components/NewPostPrompt";
import PostCard from "../Components/PostCard";
import Achivements from "../Components/Achivements";
import Loader from "../Components/Loader";
import Header from "../Components/Header";
import PageTransition from "../Components/PageTransition";
import { springPress, scaleIn, fadeUp, staggerContainer } from "../utils/motion";

const CountUp = ({ target }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(target) || 0;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 1000;
    const range = end - start;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressFraction = Math.min(progress / duration, 1);
      const current = Math.round(start + range * progressFraction);
      setCount(current);
      if (progressFraction < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target]);

  return <span>{count}</span>;
};

const Profile = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const profile = useSelector((state) => state.userProfile.user);
  const posts = useSelector((state) => state.userProfile.posts);
  const isFollowing = useSelector((state) => state.userProfile.isFollowing);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [owner, setOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("journeys"); // "journeys" | "achievements"

  const postUrl = window.location.href;

  const handleShareClick = () => {
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

  useEffect(() => {
    if (!id) return;
    dispatch(resetProfile());
    dispatch(getUserProfile(id)).then(() => {
      if (id === myProfile?._id) {
        setOwner(true);
      } else {
        setOwner(false);
      }
    });
  }, [id, myProfile, dispatch]);

  const handleFollow = () => {
    dispatch(followAndUnfollowUser({ followId: id }));
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleTwitterShare = () => {
    const text = "Check out this profile!";
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const handleWhatsAppShare = () => {
    const text = "Check out this Profile!";
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}%20${encodeURIComponent(postUrl)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (!profile) {
    return <Loader />;
  }

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        
        {/* Cover Gradient Banner */}
        <div className="w-full relative bg-gradient-to-r from-ocean-700 to-ocean-950 h-44 md:h-64 shadow-inner" />

        {/* Profile Card Container overlay */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-24 relative z-10 text-left">
          
          <div className="bg-white rounded-3xl border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.02)] p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            {/* Avatar & Info */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
              <motion.img
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                src={profile?.profilePicture?.url}
                alt={profile?.fullname}
                className="w-32 h-32 md:w-36 md:h-36 object-cover rounded-full border-4 border-white shadow-md bg-sand-100"
              />
              
              <div className="text-center md:text-left space-y-1">
                <h1 className="font-display font-bold text-2xl md:text-3xl text-sand-900 leading-tight">
                  {profile?.fullname}
                </h1>
                <p className="font-sans text-sm font-semibold text-sand-400">
                  @{profile?.username}
                </p>
                <p className="font-sans text-xs md:text-sm text-sand-600 max-w-md pt-2 leading-relaxed">
                  {profile?.bio || "No bio yet."}
                </p>
              </div>
            </div>

            {/* Actions Block */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 pt-2 md:pt-0">
              {owner ? (
                <motion.button
                  {...springPress}
                  onClick={() => navigate("/updateprofile")}
                  className="flex items-center gap-2 border border-sand-200/80 hover:border-sand-300 bg-white text-sand-600 hover:text-sand-800 rounded-xl px-5 py-2.5 font-bold text-xs shadow-sm transition-all"
                >
                  <FaUserEdit className="text-base text-sand-400" />
                  <span>Edit Profile</span>
                </motion.button>
              ) : (
                <motion.button
                  {...springPress}
                  onClick={handleFollow}
                  className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all ${
                    isFollowing
                      ? "bg-sand-400 hover:bg-sand-500"
                      : "bg-ocean-600 hover:bg-ocean-700"
                  }`}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </motion.button>
              )}

              {/* Ko-Fi and Share */}
              <div className="flex items-center gap-3">
                {profile?.koFiUrl && (
                  <a
                    href={profile?.koFiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-90 transition-opacity"
                  >
                    <img
                      height="36"
                      style={{ border: "0px", height: "36px" }}
                      src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
                      alt="Buy Me a Coffee at ko-fi.com"
                    />
                  </a>
                )}
                
                <motion.button
                  {...springPress}
                  onClick={handleShareClick}
                  className="w-9 h-9 border border-sand-200 bg-white hover:bg-sand-50 text-sand-400 hover:text-sand-600 rounded-xl flex items-center justify-center shadow-sm transition-all"
                >
                  <FaShare className="text-sm" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 bg-white rounded-2xl border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.01)] p-4 text-center mt-6">
            <div className="border-r border-sand-50 py-1">
              <p className="font-display font-bold text-xl md:text-2xl text-sand-900">
                <CountUp target={profile?.followers?.length} />
              </p>
              <p className="font-sans text-[10px] md:text-xs font-semibold text-sand-400 uppercase tracking-wider mt-0.5">
                Followers
              </p>
            </div>
            <div className="border-r border-sand-50 py-1">
              <p className="font-display font-bold text-xl md:text-2xl text-sand-900">
                <CountUp target={profile?.following?.length} />
              </p>
              <p className="font-sans text-[10px] md:text-xs font-semibold text-sand-400 uppercase tracking-wider mt-0.5">
                Following
              </p>
            </div>
            <div className="py-1">
              <p className="font-display font-bold text-xl md:text-2xl text-sand-900">
                <CountUp target={posts?.length} />
              </p>
              <p className="font-sans text-[10px] md:text-xs font-semibold text-sand-400 uppercase tracking-wider mt-0.5">
                Posts
              </p>
            </div>
          </div>

          {/* New Post Prompt (Only for owner) */}
          {owner && (
            <div className="mt-6">
              <NewPostPrompt />
            </div>
          )}

          {/* Profile Animated Tabs (Journeys vs Achievements) */}
          <div className="mt-6">
            {/* Tabs Header */}
            <div className="flex border-b border-sand-200/80 mb-6 gap-2">
              <button
                onClick={() => setActiveTab("journeys")}
                className={`relative px-6 py-3 font-display font-bold text-sm tracking-tight transition-colors duration-200 ${
                  activeTab === "journeys" ? "text-ocean-600" : "text-sand-400 hover:text-sand-700"
                }`}
              >
                <span>Journeys</span>
                {activeTab === "journeys" && (
                  <motion.div
                    layoutId="profile-tab-pill"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-ocean-600 rounded-full"
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab("achievements")}
                className={`relative px-6 py-3 font-display font-bold text-sm tracking-tight transition-colors duration-200 ${
                  activeTab === "achievements" ? "text-ocean-600" : "text-sand-400 hover:text-sand-700"
                }`}
              >
                <span>Achievements</span>
                {activeTab === "achievements" && (
                  <motion.div
                    layoutId="profile-tab-pill"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-ocean-600 rounded-full"
                  />
                )}
              </button>
            </div>

            {/* Tab Panels */}
            <AnimatePresence mode="wait">
              {activeTab === "journeys" ? (
                <motion.div
                  key="journeys"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    variants={staggerContainer(0.06, 0.04)}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {posts?.length > 0 ? (
                      posts.map((post) => (
                        <motion.div key={post.id} variants={fadeUp}>
                          <PostCard post={post} />
                        </motion.div>
                      ))
                    ) : (
                      <motion.div
                        variants={fadeUp}
                        className="bg-white rounded-3xl p-8 border border-sand-100 text-center text-sand-500 font-sans shadow-[0_8px_30px_rgb(20,41,57,0.01)]"
                      >
                        No posts available in this section.
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Achivements />
                </motion.div>
              )}
            </AnimatePresence>
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
                  Share Profile
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
                    <span>Profile link copied!</span>
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
    </PageTransition>
  );
};

export default Profile;
