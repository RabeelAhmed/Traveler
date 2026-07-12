import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { HiCheck } from "react-icons/hi";
import { axiosClient } from "../utils/axiosClient";
import Header from "../Components/Header";
import PageTransition from "../Components/PageTransition";
import { springPress, scaleIn, fadeUp } from "../utils/motion";

export const ProfileUpdate = () => {
  const myProfile = useSelector((state) => state.appConfig.myProfile);

  const [formData, setFormData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (myProfile) {
      setFormData({
        fullname: myProfile.fullname || "",
        email: myProfile.email || "",
        dateOfBirth: myProfile.dateOfBirth ? myProfile.dateOfBirth.split("T")[0] : "",
      });
      setImagePreview(myProfile.profilePicture?.url || "");
    }
  }, [myProfile]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedImageExts = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (!allowedImageExts.includes(ext)) {
      toast.error("Unsupported file type. Only jpg, jpeg, png, webp images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Profile picture size too large. Maximum 10 MB allowed.");
      e.target.value = "";
      return;
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updateData = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value) updateData.append(key, value);
    });

    if (profileImage) {
      updateData.append("profilePicture", profileImage);
    }

    try {
      const response = await axiosClient.post("/auth/updateProfile", updateData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Profile Updated:", response.data);
      setSaved(true);
      toast.success("Profile updated successfully!");
      setTimeout(() => setSaved(false), 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Profile update failed!");
    }
  };

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        
        {/* Settings Header */}
        <Header
          title="Edit Profile"
          subtitle="Update your photo, email, and personal credentials."
        />

        {/* 2-Column Settings Layout Container */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-3xl border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.02)] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start text-left"
          >
            {/* Left Column: Avatar Preview */}
            <div className="w-full md:w-1/3 flex flex-col items-center sticky top-24">
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="User Avatar Preview"
                  className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-full border-4 border-white shadow-md bg-sand-100"
                />
              </div>

              <label
                htmlFor="fileInput"
                className="mt-5 cursor-pointer border border-sand-200/80 hover:border-sand-300 bg-white hover:bg-sand-50 text-sand-600 hover:text-sand-800 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all text-center select-none"
              >
                Choose New Image
              </label>
              
              <input
                type="file"
                accept="image/*"
                id="fileInput"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Right Column: Form Fields */}
            <form onSubmit={handleSubmit} className="flex-1 w-full space-y-5">
              {[
                { label: "Full Name", name: "fullname", type: "text" },
                { label: "Email", name: "email", type: "email" },
                { label: "Date of Birth", name: "dateOfBirth", type: "date" },
              ].map(({ label, name, type }, index) => (
                <div key={index} className="flex flex-col gap-1.5 w-full">
                  <input
                    type={type}
                    name={name}
                    id={name}
                    value={formData[name] || ""}
                    onChange={handleChange}
                    className="peer order-2 w-full px-4 py-3 bg-sand-50/50 border border-sand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white transition-all text-xs md:text-sm text-sand-800"
                  />
                  <label
                    htmlFor={name}
                    className="order-1 text-xs font-bold text-sand-400 transition-colors peer-focus:text-ocean-600 uppercase tracking-wider"
                  >
                    {label}
                  </label>
                </div>
              ))}

              {/* Submit Action */}
              <div className="pt-4 flex justify-end">
                <motion.button
                  {...springPress}
                  type="submit"
                  className={`px-8 py-3 rounded-xl font-bold text-xs shadow-sm transition-colors duration-200 flex items-center justify-center min-w-32 ${
                    saved
                      ? "bg-jade-600 text-white"
                      : "bg-ocean-600 hover:bg-ocean-700 text-white"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {saved ? (
                      <motion.div
                        key="saved"
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="flex items-center gap-1"
                      >
                        <HiCheck className="text-base text-white animate-bounce" />
                        <span>Saved</span>
                      </motion.div>
                    ) : (
                      <span key="idle">Save Changes</span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ProfileUpdate;