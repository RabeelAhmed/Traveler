import React, { useRef, useState, useEffect } from "react";
import { PiChatsCircle } from "react-icons/pi";
import { IoIosAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { RiWechatPayLine } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";
import { CiLocationOn } from "react-icons/ci";
import { TbHash } from "react-icons/tb";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaFacebookF, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import { springPress } from "../utils/motion";
import { getTrendingDestinations } from "../Toolkit/slices/trendingSlice";
import { getTrendingTags } from "../Toolkit/slices/trendingTagsSlice";

export const LeftRail = ({ active, setActive }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: "feed", icon: PiChatsCircle, label: "Feed" },
    { id: "followers", icon: RiWechatPayLine, label: "Followers" },
    { id: "myPosts", icon: FaEdit, label: "My Posts" },
    { id: "newPost", icon: IoIosAddCircle, label: "New Post" },
  ];

  const handleRailClick = (item) => {
    if (item.id === "newPost") {
      navigate("/createpost");
    } else {
      setActive(item.id);
    }
  };

  return (
    <div className="flex flex-row md:flex-col gap-3 bg-white rounded-3xl border border-sand-100 p-3 shadow-[0_8px_30px_rgb(20,41,57,0.02)] w-full items-center justify-around md:justify-start">
      {menuItems.map((item) => {
        const isActive = active === item.id;
        const Icon = item.icon;
        return (
          <div key={item.id} className="relative group flex items-center justify-center">
            <motion.button
              {...springPress}
              onClick={() => handleRailClick(item)}
              className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors duration-300 ${
                isActive ? "text-ocean-600" : "text-sand-400 hover:text-sand-700"
              }`}
            >
              <Icon />
            </motion.button>
            {isActive && (
              <motion.div
                layoutId="left-rail-pill"
                className="absolute inset-0 bg-ocean-50 rounded-2xl z-0"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {/* Tooltip */}
            <span className="absolute left-16 px-2.5 py-1.5 bg-sand-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md whitespace-nowrap z-50 hidden md:block">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const RightDiscovery = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const { destinations } = useSelector((state) => state.trending);
  const { tags, status: tagsStatus } = useSelector((state) => state.trendingTags);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (destinations.length === 0) {
      dispatch(getTrendingDestinations());
    }
  }, [dispatch, destinations.length]);

  // Fetch tags on mount and whenever socket resets status to idle
  useEffect(() => {
    if (tagsStatus === 'idle') {
      dispatch(getTrendingTags());
    }
  }, [dispatch, tagsStatus]);

  // Developer Note: Sidebar.jsx's share handlers reference a postUrl variable that doesn't exist in that file.
  // We define it locally here for profile sharing.
  const postUrl = `${window.location.origin}/profile/${myProfile?._id}`;

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      postUrl
    )}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleTwitterShare = () => {
    const text = "Check out this profile!";
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      postUrl
    )}&text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const handleWhatsAppShare = () => {
    const text = "Check out this Profile!";
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      text
    )}%20${encodeURIComponent(postUrl)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleSearch = () => {
    const trimmedQuery = searchTerm.trim();
    if (trimmedQuery) {
      navigate(`/search?query=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search Card */}
      <div className="bg-white rounded-3xl border border-sand-100 p-5 shadow-[0_8px_30px_rgb(20,41,57,0.02)] flex flex-col gap-3">
        <h3 className="font-display font-semibold text-sm text-sand-900">Search Posts</h3>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search tags or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white"
          />
          <IoSearchSharp className="absolute left-3.5 text-sand-400 text-lg" />
        </div>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-3xl border border-sand-100 p-6 shadow-[0_8px_30px_rgb(20,41,57,0.02)] flex flex-col items-center text-center">
        <div className="relative">
          <img
            src={myProfile?.profilePicture?.url}
            alt={myProfile?.fullname}
            className="w-20 h-20 rounded-full object-cover border-2 border-ocean-100 shadow-sm"
          />
          <span className="absolute bottom-1 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        <h4 className="font-display font-bold text-base text-sand-900 mt-4">
          {myProfile?.fullname}
        </h4>
        <p className="font-sans text-xs text-sand-500 line-clamp-3 mt-1.5 leading-relaxed">
          {myProfile?.bio}
        </p>
        <div className="flex gap-4 mt-5 text-sand-400">
          <button onClick={handleFacebookShare} className="hover:text-blue-600 transition-colors">
            <FaFacebookF className="text-lg" />
          </button>
          <button onClick={handleTwitterShare} className="hover:text-sky-500 transition-colors">
            <FaTwitter className="text-lg" />
          </button>
          <button onClick={handleWhatsAppShare} className="hover:text-green-500 transition-colors">
            <FaWhatsapp className="text-lg" />
          </button>
        </div>
      </div>

      {/* Trending Tags Card */}
      <div className="bg-white rounded-3xl border border-sand-100 p-5 shadow-[0_8px_30px_rgb(20,41,57,0.02)] relative overflow-hidden group">
        {/* Subtle decorative top border */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-ocean-300 to-ocean-500 opacity-70" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🏷️</span>
            <h3 className="font-display font-extrabold text-xs text-sand-700 uppercase tracking-wider">
              Trending Tags
            </h3>
          </div>
          {tagsStatus === 'loading' && (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-ocean-500 border-t-transparent animate-spin" />
          )}
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {tags.length > 0
            ? tags.slice(0, 10).map(({ tag, count }) => (
                <motion.button
                  key={tag}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/search?query=${encodeURIComponent(tag)}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-sand-50/50 to-sand-50 hover:from-ocean-50 hover:to-ocean-100/50 text-sand-700 hover:text-ocean-700 rounded-xl text-xs font-bold transition-all duration-300 border border-sand-100 hover:border-ocean-200 shadow-sm"
                >
                  <span className="text-ocean-400 font-extrabold text-[10px]">#</span>
                  <span>{tag.replace(/^#/, '')}</span>
                  <span className="ml-0.5 text-[9px] font-extrabold text-sand-500 bg-sand-200/60 px-1.5 py-0.5 rounded-full group-hover:bg-ocean-100">
                    {count}
                  </span>
                </motion.button>
              ))
            : tagsStatus === 'loading'
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-7 w-16 bg-sand-100 rounded-xl animate-pulse" />
              ))
            : (
                <p className="text-xs text-sand-400 py-2">No hashtags yet — be the first to add one!</p>
              )
          }
        </div>
      </div>

      {/* 🔥 Trending Places Card */}
      <div className="bg-white rounded-3xl border border-sand-100 p-5 shadow-[0_8px_30px_rgb(20,41,57,0.02)] relative overflow-hidden group">
        {/* Subtle decorative top border */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 to-amber-300 opacity-70" />

        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">🔥</span>
          <h3 className="font-display font-extrabold text-xs text-sand-700 uppercase tracking-wider">
            Trending Places
          </h3>
        </div>

        {destinations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="w-1.5 h-1.5 bg-sand-300 rounded-full animate-bounce" />
            <p className="text-xs text-sand-400 text-center">Loading destinations...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {destinations.slice(0, 5).map((dest, index) => {
              const rankColors = [
                "bg-amber-500 text-white shadow-amber-300/30",
                "bg-slate-400 text-white shadow-slate-350/30",
                "bg-orange-400 text-white shadow-orange-350/30",
              ];
              const rankStyle = rankColors[index] || "bg-sand-100 text-sand-500";
              return (
                <motion.div
                  key={`${dest.location}-${index}`}
                  whileHover={{ x: 3 }}
                  onClick={() => navigate(`/search?query=${encodeURIComponent(dest.location)}`)}
                  className="flex items-center gap-3 p-2 bg-gradient-to-br from-transparent to-transparent hover:from-sand-50/50 hover:to-sand-50 rounded-2xl border border-transparent hover:border-sand-100 transition-all duration-300 cursor-pointer"
                >
                  {/* Rank indicator & Thumbnail in a layered stack */}
                  <div className="relative flex-shrink-0">
                    {dest.thumbnail?.url ? (
                      <img
                        src={dest.thumbnail.url}
                        alt={dest.location}
                        className="w-10 h-10 rounded-xl object-cover border border-sand-100/50 shadow-inner group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-50 to-sand-100 flex items-center justify-center border border-sand-100/50">
                        <CiLocationOn className="text-ocean-400 text-base" />
                      </div>
                    )}
                    {/* Floating badge for rank */}
                    <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border border-white shadow ${rankStyle}`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Location name + count */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-extrabold text-xs text-sand-800 truncate leading-tight group-hover:text-ocean-600 transition-colors">
                      {dest.location}
                    </p>
                    <p className="font-sans text-[10px] text-sand-400 font-semibold mt-0.5">
                      {dest.postCount} {dest.postCount === 1 ? "post" : "posts"}
                    </p>
                  </div>

                  {/* Rating Badge */}
                  {dest.avgRating != null && (
                    <div className="flex items-center gap-0.5 bg-ocean-50 border border-ocean-100/50 rounded-lg px-1.5 py-0.5 self-center">
                      <span className="text-[9px] font-black text-ocean-700">{dest.avgRating.toFixed(1)}</span>
                      <span className="text-[8px] text-amber-500">★</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* See all link */}
        <Link
          to="/trending"
          className="flex items-center justify-center gap-1 text-[11px] font-bold text-ocean-600 hover:text-ocean-700 mt-4 transition-all duration-300 hover:gap-1.5"
        >
          <span>Explore all destinations</span>
          <span className="text-[10px]">➔</span>
        </Link>
      </div>
    </div>
  );
};

const Sidebar = ({ active, setActive }) => {
  return <LeftRail active={active} setActive={setActive} />;
};

export default Sidebar;
