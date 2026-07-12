import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiUser,
  HiCalendar,
  HiCurrencyDollar,
  HiCamera,
  HiCheck,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { springPress, scaleIn } from "../../../utils/motion";

const AccountSetup = ({ accountSetupInfo, setAccountSetupInfo }) => {
  const handleInterestChange = (interest) => {
    setAccountSetupInfo((prevInfo) => ({
      ...prevInfo,
      interests: prevInfo.interests.includes(interest)
        ? prevInfo.interests.filter((i) => i !== interest)
        : [...prevInfo.interests, interest],
    }));
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setAccountSetupInfo((prevInfo) => ({
      ...prevInfo,
      [id]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedImageExts = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (!allowedImageExts.includes(ext)) {
      toast.error("Unsupported file type. Only jpg, jpeg, png, webp images are allowed for profile pictures.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Profile picture size too large. Maximum 10 MB allowed.");
      e.target.value = "";
      return;
    }

    setAccountSetupInfo((prevInfo) => ({
      ...prevInfo,
      profilePicture: file,
    }));
  };

  return (
    <div className="w-full">
      <h2 className="font-display font-semibold text-2xl text-sand-900 mb-6">
        Complete Setup
      </h2>

      {/* Full Name */}
      <div className="mb-4">
        <label htmlFor="fullname" className="block text-sm text-sand-700 font-semibold mb-2">
          Full Name
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
            <HiUser className="text-xl" />
          </span>
          <input
            id="fullname"
            type="text"
            value={accountSetupInfo.fullname}
            onChange={handleInputChange}
            placeholder="Enter Full Name"
            className="pl-11 pr-4 py-3 bg-sand-50 border border-sand-200 rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="mb-4">
        <label htmlFor="bio" className="block text-sm text-sand-700 font-semibold mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          value={accountSetupInfo.bio}
          onChange={handleInputChange}
          placeholder="Tell us about yourself..."
          className="px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 focus:bg-white h-20 resize-none"
          maxLength="300"
        />
      </div>

      {/* Date of Birth */}
      <div className="mb-4">
        <label htmlFor="dateOfBirth" className="block text-sm text-sand-700 font-semibold mb-2">
          Date of Birth
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
            <HiCalendar className="text-xl" />
          </span>
          <input
            id="dateOfBirth"
            type="date"
            value={accountSetupInfo.dateOfBirth}
            onChange={handleInputChange}
            className="pl-11 pr-4 py-3 bg-sand-50 border border-sand-200 rounded-xl w-full text-sand-800 transition-all focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 focus:bg-white"
          />
        </div>
      </div>

      {/* KoFi */}
      <div className="mb-4">
        <label htmlFor="kofi" className="block text-sm text-sand-700 font-semibold mb-2">
          Buy Me Ko-Fi URL (Optional)
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
            <HiCurrencyDollar className="text-xl" />
          </span>
          <input
            id="kofi"
            type="text"
            value={accountSetupInfo.kofi}
            onChange={handleInputChange}
            placeholder="e.g. https://ko-fi.com/username"
            className="pl-11 pr-4 py-3 bg-sand-50 border border-sand-200 rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Profile Picture */}
      <div className="mb-6">
        <label htmlFor="profilePicture" className="block text-sm text-sand-700 font-semibold mb-2">
          Profile Picture
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
            <HiCamera className="text-xl" />
          </span>
          <input
            id="profilePicture"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="pl-11 pr-4 py-2.5 bg-sand-50 border border-sand-200 rounded-xl w-full text-sm text-sand-500 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-ocean-50 file:text-ocean-600 hover:file:bg-ocean-100 transition-all focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white"
          />
        </div>
      </div>

      {/* Interests */}
      <div className="mb-6">
        <label className="block text-sm text-sand-700 font-semibold mb-3">
          Select Your Interests
        </label>
        <div className="flex flex-wrap gap-2">
          {["Adventure", "History", "Technology", "Art", "Nature", "Food", "Travel", "Sports"].map((interest) => {
            const isSelected = accountSetupInfo.interests.includes(interest);
            return (
              <motion.button
                key={interest}
                type="button"
                {...springPress}
                onClick={() => handleInterestChange(interest)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 ${
                  isSelected
                    ? "bg-ocean-600 text-white shadow-sm"
                    : "bg-sand-100 text-sand-600 hover:bg-sand-200"
                }`}
              >
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.span
                      variants={scaleIn}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="inline-flex items-center"
                    >
                      <HiCheck className="text-sm" />
                    </motion.span>
                  )}
                </AnimatePresence>
                <span>{interest}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AccountSetup;
