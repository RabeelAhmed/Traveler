import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import AccountInformation from "./steps/AccountInformation";
import AccountSetup from "./steps/AccountSetup";
import Stepper from "../../Components/Stepper";
import StepperControl from "../../Components/StepperControl";
import Complete from "./steps/Complete";
import authPng from "../../assets/Images/NewYork-pana1.png";
import PageTransition from "../../Components/PageTransition";
import SEO from "../../Components/SEO";
import { scaleIn } from "../../utils/motion";

const Signup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [accountInfo, setAccountInfo] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [accountSetupInfo, setAccountSetupInfo] = useState({
    fullname: "",
    bio: "",
    dateOfBirth: "",
    kofi: "",
    profilePicture: null,
    interests: [],
  });

  const steps = ["Account Information", "Account Setup", "Complete"];

  const handleNext = () => {
    if (currentStep === 1) {
      console.log(accountInfo);
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
      if (!accountInfo.username.trim()) {
        toast.error("Username is required");
        return;
      }
      if (emailPattern.test(accountInfo.username)) {
        toast.error("Username cannot be an email address");
        return;
      }
    
      if (!accountInfo.email.trim()) {
        toast.error("Email is required");
        return;
      }
      if (!emailPattern.test(accountInfo.email)) {
        toast.error("Please enter a valid email");
        return;
      }
    
      if (!accountInfo.password.trim()) {
        toast.error("Password is required");
        return;
      }
      if (accountInfo.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }

    if (currentStep === 2) {
      console.log(accountSetupInfo);
      let error = "";
    
      if (!accountSetupInfo.fullname.trim()) {
        error = "Full name is required";
        toast.error(error);
      }
    
      if (!accountSetupInfo.bio.trim()) {
        error = "Bio is required";
        toast.error(error);
      }
    
      if (!accountSetupInfo.dateOfBirth) {
        error = "Date of Birth is required";
        toast.error(error);
      }
    
      if (!accountSetupInfo.profilePicture) {
        error = "Profile picture is required";
        toast.error(error);
      }
    
      if (!accountSetupInfo.interests || accountSetupInfo.interests.length === 0) {
        error = "At least one interest must be selected";
        toast.error(error);
      }
    
      if (error) {
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const displayStep = (step) => {
    switch (step) {
      case 1:
        return (
          <AccountInformation
            setCurrentStep={setCurrentStep}
            accountInfo={accountInfo}
            setAccountInfo={setAccountInfo}
          />
        );
      case 2:
        return (
          <AccountSetup
            setCurrentStep={setCurrentStep}
            accountSetupInfo={accountSetupInfo}
            setAccountSetupInfo={setAccountSetupInfo}
          />
        );
      case 3:
        return (
          <Complete
            accountInfo={accountInfo}
            accountSetupInfo={accountSetupInfo}
          />
        );
      default:
        return null;
    }
  };

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" } },
  };

  return (
    <PageTransition>
      <SEO title="Signup | Traveler" noindex={true} path="/signup" />
      <div className="min-h-screen bg-sand-50 grid grid-cols-1 md:grid-cols-7 relative overflow-hidden">
        {/* Left Section - Shared Illustration Panel */}
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

        {/* Right Section - Steps */}
        <div className="col-span-4 flex items-center justify-center min-h-screen px-4 sm:px-6 py-12 z-10">
          <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(20,41,57,0.04)] border border-sand-100/80">
            
            {/* Sliding step wrapper */}
            <div className="overflow-hidden min-h-[380px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
                >
                  {displayStep(currentStep)}
                </motion.div>
              </AnimatePresence>
            </div>

            <Stepper steps={steps} currentStep={currentStep} />
            <StepperControl
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              handleNext={handleNext}
            />

            <p className="text-center text-sm text-sand-600 mt-6">
              Already have an Account?{" "}
              <Link
                to="/login"
                className="text-ocean-600 hover:text-ocean-700 font-semibold underline underline-offset-1"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Signup;
