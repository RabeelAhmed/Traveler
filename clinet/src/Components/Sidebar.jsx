import React, { useRef, useState } from "react";
import { PiChatsCircle } from "react-icons/pi";
import { IoIosAddCircle } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { RiWechatPayLine } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { FaFacebookF, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import { springPress } from "../utils/motion";

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
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const [searchTerm, setSearchTerm] = useState("");

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
      <div className="bg-white rounded-3xl border border-sand-100 p-5 shadow-[0_8px_30px_rgb(20,41,57,0.02)]">
        <h3 className="font-display font-bold text-xs text-sand-400 uppercase tracking-widest mb-4">
          Trending Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {["#beach", "#hiking", "#adventure", "#mountains", "#foodie", "#nature"].map((tag) => (
            <button
              key={tag}
              onClick={() => navigate(`/search?query=${encodeURIComponent(tag)}`)}
              className="px-3 py-1.5 bg-sand-50 hover:bg-ocean-50 text-sand-600 hover:text-ocean-600 rounded-lg text-xs font-semibold transition-colors duration-200"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ active, setActive }) => {
  return <LeftRail active={active} setActive={setActive} />;
};

export default Sidebar;
