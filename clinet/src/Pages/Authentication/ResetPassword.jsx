import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiLockClosed, HiCheck } from "react-icons/hi";
import { toast } from "react-hot-toast";
import { axiosClient } from "../../utils/axiosClient";
import TravelerLogo from "../../Components/TravelerLogo";
import PageTransition from "../../Components/PageTransition";
import { springPress, scaleIn } from "../../utils/motion";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsResetting(true);
    try {
      const response = await axiosClient.post("auth/reset-password", {
        token,
        newPassword: password,
      });

      if (response.status === 200) {
        setSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        toast.success("Password reset successfully!");
        navigate("/login", { replace: true });
      } else {
        toast.error(response.data.message || "Failed to reset password");
      }
    } catch (err) {
      console.log(err);
      if (err.response && err.response.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } finally {
      setIsResetting(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const cardEntrance = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-sand-50 px-4 sm:px-6">
        
        {/* Centered card wrapper */}
        <motion.div
          variants={cardEntrance}
          initial="hidden"
          animate="visible"
          className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(20,41,57,0.04)] border border-sand-100/80 w-full max-w-md"
        >
          {/* Brand Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-7 w-auto text-ocean-600">
              <TravelerLogo fill="#41789f" className="h-full" />
            </div>
          </div>

          <h1 className="font-display font-semibold text-2xl text-sand-900 mb-6 text-center">
            Reset Your Password
          </h1>

          {/* New Password input */}
          <div className="mb-4">
            <label className="block text-sm text-sand-700 font-semibold mb-2">
              New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
                <HiLockClosed className="text-xl" />
              </span>
              <input
                type="password"
                placeholder="Enter New Password"
                className="pl-11 pr-4 py-3 bg-sand-50 border border-sand-200 rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 focus:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Confirm Password input */}
          <div className="mb-6">
            <label className="block text-sm text-sand-700 font-semibold mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
                <HiLockClosed className="text-xl" />
              </span>
              <input
                type="password"
                placeholder="Confirm New Password"
                className="pl-11 pr-4 py-3 bg-sand-50 border border-sand-200 rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 focus:bg-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* Passwords match indicator */}
            <div className="min-h-5 mt-1.5 pl-1">
              <AnimatePresence>
                {passwordsMatch && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-1.5 text-jade-600 text-xs font-semibold"
                  >
                    <HiCheck className="text-sm" />
                    <span>Passwords match</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Submit button */}
          <motion.button
            {...springPress}
            onClick={handleResetPassword}
            disabled={isResetting || success}
            className={`px-4 py-3 text-white font-semibold rounded-xl w-full shadow-[0_8px_24px_rgb(20,41,57,0.12)] transition-all flex items-center justify-center gap-2 ${
              success
                ? "bg-jade-600 shadow-jade-200"
                : isResetting
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
                <HiCheck className="text-xl text-white" />
                <span>Passwords Updated!</span>
              </motion.div>
            ) : isResetting ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Resetting Password...</span>
              </div>
            ) : (
              "Reset Password"
            )}
          </motion.button>
        </motion.div>

        {/* Back to Login link */}
        <Link
          to="/login"
          className="text-sand-500 hover:text-ocean-600 font-semibold text-sm transition-colors duration-200 mt-6 inline-block"
        >
          ← Back to Login
        </Link>
      </div>
    </PageTransition>
  );
}

export default ResetPassword;