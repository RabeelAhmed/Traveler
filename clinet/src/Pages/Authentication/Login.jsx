import { useState } from "react";
import React from "react";
import authPng from "../../assets/Images/Tokyo-pana 1.png";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { axiosClient } from "../../utils/axiosClient";
import { setItem, KEY_ACCESS_TOKEN } from "../../utils/LocalStorageManager";
import { setLoggedIn } from "../../Toolkit/slices/appConfigSlice";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiMail, HiLockClosed } from "react-icons/hi";
import PageTransition from "../../Components/PageTransition";
import { fadeUp, scaleIn, springPress } from "../../utils/motion";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/home";

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const submitHandler = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await axiosClient.post("auth/login", {
        email,
        password,
      });

      if (response.data.status === "error") {
        triggerShake();
        toast.error(response.data.message);
        setIsSubmitting(false);
        return;
      }

      console.log(response);
      setItem(KEY_ACCESS_TOKEN, response.data.result.token);
      dispatch(setLoggedIn(true));
      navigate(from, { replace: true });
      window.location.reload();
    } catch (err) {
      console.log(err);
      triggerShake();
      toast.error("Login failed! Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSendingResetLink(true);
    try {
      const response = await axiosClient.post("auth/forget-pasword", {
        email: forgotPasswordEmail,
      });

      if (response.status === 200) {
        toast.success("Password reset link sent to your email!");
        setShowForgotPassword(false);
      } else {
        toast.error(response.data.message || "Failed to send reset link");
      }
    } catch (err) {
      console.log(err);
      if (err.response && err.response.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Failed to send reset link. Please try again.");
      }
    } finally {
      setIsSendingResetLink(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-sand-50 grid grid-cols-1 md:grid-cols-7 relative overflow-hidden">
        {/* Left Section - Illustration Panel */}
        <motion.div
          layoutId="auth-illustration-panel"
          className="col-span-3 h-screen bg-gradient-to-br from-ocean-700 to-ocean-950 hidden md:flex flex-col items-center justify-center relative p-8 text-white z-10"
        >
          <div className="text-center max-w-sm flex flex-col items-center">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-white/95 leading-snug">
              Get reliable and accurate travel information all on one site.
            </h2>
            <motion.img
              src={authPng}
              alt="Travel illustration"
              className="mt-12 w-64 md:w-80 h-auto object-contain"
              animate={{ y: [-8, 8, -8] }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
                repeatType: "mirror",
              }}
            />
          </div>
        </motion.div>

        {/* Right Section - Form Panel */}
        <div className="col-span-4 flex items-center justify-center min-h-screen px-4 sm:px-6 py-12 z-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={shake ? { x: [-8, 8, -8, 8, 0] } : "visible"}
            transition={shake ? { duration: 0.4 } : undefined}
            className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(20,41,57,0.04)] border border-sand-100/80"
          >
            <h1 className="font-display font-semibold text-2xl text-sand-900 mb-6">
              Log In to Traveler
            </h1>

            {/* Email field */}
            <div className="mb-5">
              <label className="block text-sm text-sand-700 font-semibold mb-2">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
                  <HiMail className="text-xl" />
                </span>
                <input
                  type="text"
                  placeholder="Email"
                  className="pl-11 pr-4 py-3 bg-sand-50 border border-sand-200 rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 focus:bg-white"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="mb-2">
              <label className="block text-sm text-sand-700 font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
                  <HiLockClosed className="text-xl" />
                </span>
                <input
                  type="password"
                  placeholder="Password"
                  className="pl-11 pr-4 py-3 bg-sand-50 border border-sand-200 rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 focus:bg-white"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
              </div>
            </div>

            <p
              className="mb-8 text-right text-ocean-600 hover:text-ocean-700 underline underline-offset-1 text-xs font-semibold cursor-pointer"
              onClick={() => setShowForgotPassword(true)}
            >
              Forget Password?
            </p>

            <motion.button
              {...springPress}
              disabled={isSubmitting}
              className={`px-4 py-3 bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 text-white rounded-xl font-semibold w-full shadow-[0_8px_24px_rgb(20,41,57,0.12)] transition-all flex items-center justify-center gap-2 ${
                isSubmitting ? "opacity-75 cursor-not-allowed" : ""
              }`}
              onClick={submitHandler}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in…</span>
                </>
              ) : (
                "Sign In"
              )}
            </motion.button>

            <p className="text-center text-sm text-sand-600 mt-6">
              Not a Member Yet?{" "}
              <Link to="/signup" className="text-ocean-600 hover:text-ocean-700 font-semibold underline underline-offset-1">
                Sign Up
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Forgot Password Modal */}
        <AnimatePresence>
          {showForgotPassword && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ocean-950/20 backdrop-blur-md"
                onClick={() => setShowForgotPassword(false)}
              />
              {/* Modal Box */}
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="relative bg-white p-8 rounded-3xl w-full max-w-md shadow-[0_8px_30px_rgb(20,41,57,0.12)] border border-sand-100 z-10 origin-center"
              >
                <h2 className="font-display font-semibold text-2xl text-sand-900 mb-3">
                  Forgot Password
                </h2>
                <p className="font-sans text-sm text-sand-500 mb-6 leading-relaxed">
                  Enter your email address to receive a password reset link
                </p>

                <div className="relative mb-6">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
                    <HiMail className="text-xl" />
                  </span>
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="pl-11 pr-4 py-3 bg-sand-50 border border-sand-200 rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400 focus:bg-white"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    className="px-5 py-2.5 bg-sand-100 hover:bg-sand-200 text-sand-700 font-semibold rounded-xl text-sm transition-colors"
                    onClick={() => setShowForgotPassword(false)}
                    disabled={isSendingResetLink}
                  >
                    Cancel
                  </button>
                  <motion.button
                    {...springPress}
                    className="px-5 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                    onClick={handleForgotPassword}
                    disabled={isSendingResetLink}
                  >
                    {isSendingResetLink ? "Sending..." : "Send Reset Link"}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

export default Login;
