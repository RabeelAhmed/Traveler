import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { HiCheck } from "react-icons/hi";
import { axiosClient } from "../../../utils/axiosClient";
import { setItem, KEY_ACCESS_TOKEN } from "../../../utils/LocalStorageManager";
import { setLoggedIn } from "../../../Toolkit/slices/appConfigSlice";
import { uploadProfilePictureToCloudinary } from "../../../utils/cloudinaryUpload";
import { springPress, scaleIn } from "../../../utils/motion";

const Complete = ({ accountSetupInfo, accountInfo }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSignUp = async () => {
    if (loading || success) return;
    setLoading(true);
    try {
      let uploadedProfilePicture = null;

      if (accountSetupInfo.profilePicture) {
        uploadedProfilePicture = await uploadProfilePictureToCloudinary(
          accountSetupInfo.profilePicture
        );
      }

      const signupData = {
        username: accountInfo.username,
        email: accountInfo.email,
        password: accountInfo.password,
        fullname: accountSetupInfo.fullname,
        bio: accountSetupInfo.bio,
        dateOfBirth: accountSetupInfo.dateOfBirth,
        kofi: accountSetupInfo.kofi,
        interests: accountSetupInfo.interests,
        profilePictureUrl: uploadedProfilePicture?.secure_url || null,
        profilePicturePublicId: uploadedProfilePicture?.public_id || null,
      };

      const response = await axiosClient.post("auth/signup", signupData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response?.data?.result) {
        setSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        setItem(KEY_ACCESS_TOKEN, response.data.result);
        dispatch(setLoggedIn(true));
        toast.success("Sign Up Successful");
        navigate("/home");
      } else {
        toast.error(response.data?.message || "Sign Up Failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.error?.message || "An error occurred during sign-up"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center w-full">
      <h2 className="font-display font-semibold text-2xl text-sand-900 mb-3">
        Ready to Explore?
      </h2>
      <p className="font-sans text-sm text-sand-500 mb-8 leading-relaxed">
        Everything is set up! Click the button below to create your Traveler profile and begin mapping your journeys.
      </p>

      <motion.button
        {...springPress}
        onClick={handleSignUp}
        disabled={loading || success}
        className={`px-4 py-3 text-white rounded-xl font-semibold w-full shadow-[0_8px_24px_rgb(20,41,57,0.12)] transition-all flex items-center justify-center gap-2 ${
          success
            ? "bg-jade-600 shadow-jade-200"
            : loading
              ? "bg-ocean-500 opacity-75 cursor-not-allowed"
              : "bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800"
        }`}
      >
        {success ? (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-2"
          >
            <HiCheck className="text-xl text-white animate-pulse" />
            <span>Success!</span>
          </motion.div>
        ) : loading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Signing Up...</span>
          </div>
        ) : (
          "Sign Up"
        )}
      </motion.button>
    </div>
  );
};

export default Complete;
