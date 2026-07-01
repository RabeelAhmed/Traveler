import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../assets/Images/traveler_logo_animated.gif";
import MobileTabBar from "./MobileTabBar";
import { removeItem, KEY_ACCESS_TOKEN } from "../utils/LocalStorageManager";
import { scaleIn, springPress } from "../utils/motion";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.appConfig.isLoggedIn);
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const userId = myProfile?._id;

  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const subMenuRef = useRef(null);

  const toggleSubMenu = (e) => {
    e.stopPropagation();
    setIsSubMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target)) {
        setIsSubMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const location = useLocation();
  useEffect(() => {
    setIsSubMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure you want to Logout?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2f5a79",
      cancelButtonColor: "#f1663a",
      confirmButtonText: "Yes, Logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        removeItem(KEY_ACCESS_TOKEN);
        window.location.replace("/");
      }
    });
  };

  const isHeroRoute = location.pathname === "/" || location.pathname === "/home";
  const isCompact = scrolled || !isHeroRoute;

  const navLinks = [
    { path: "/home", label: "Home" },
    { path: "/story", label: "Story" },
    { path: "/forum", label: "Forum" },
    { path: "/traveladvisor", label: "Travel Advisor" },
  ];

  return (
    <>
      <div
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ease-in-out flex items-center justify-between px-6 sm:px-8 md:px-12 ${
          isCompact
            ? "glass-light py-3 border-b border-sand-200/80 shadow-[0_8px_30px_rgb(20,41,57,0.04)] text-sand-800"
            : "bg-transparent py-6 text-white"
        }`}
      >
        {/* Logo */}
        <Link to="/home" className="block focus:outline-none">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className={`${isCompact ? "h-7 md:h-8" : "h-9 md:h-10"} w-auto transition-all duration-500 flex items-center`}
          >
            <img src={Logo} alt="Traveler Logo" className="h-full object-contain" />
          </motion.div>
        </Link>

        {/* Desktop Menu links & profile */}
        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-8">
            <nav className="relative">
              <ul className="flex items-center gap-1.5 font-sans text-sm font-semibold tracking-tight">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <li key={link.path} className="relative py-2 px-4 rounded-full transition-colors">
                      <Link
                        to={link.path}
                        className={`relative z-10 transition-colors duration-300 ${
                          isActive 
                            ? "text-ocean-600 font-bold" 
                            : isCompact 
                              ? "text-sand-600 hover:text-sand-900" 
                              : "text-white/80 hover:text-white"
                        }`}
                      >
                        {link.label}
                      </Link>
                      {isActive && (
                        <motion.div
                          layoutId="desktop-nav-pill"
                          className={`absolute inset-0 rounded-full z-0 ${
                            isCompact ? "bg-ocean-50" : "bg-white/15"
                          }`}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Profile Dropdown */}
            <div className="relative" ref={subMenuRef}>
              <motion.button
                {...springPress}
                onClick={toggleSubMenu}
                className="focus:outline-none block"
              >
                <img
                  src={myProfile?.profilePicture?.url || ""}
                  alt="User"
                  className={`w-9 h-9 object-cover rounded-full border-2 transition-all duration-300 ${
                    isCompact ? "border-ocean-500" : "border-white"
                  }`}
                />
              </motion.button>
              <AnimatePresence>
                {isSubMenuOpen && (
                  <motion.ul
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="absolute right-0 mt-3 w-44 bg-white border border-sand-200/80 text-sand-800 rounded-2xl shadow-[0_8px_30px_rgb(20,41,57,0.08)] p-2 z-50 origin-top-right"
                  >
                    <motion.li {...springPress} className="rounded-xl overflow-hidden mb-1">
                      <Link
                        to={`/profile/${userId}`}
                        className="block px-4 py-2.5 text-sm font-semibold text-sand-700 hover:bg-ocean-50 hover:text-ocean-600 transition-colors duration-200"
                      >
                        Profile
                      </Link>
                    </motion.li>
                    <motion.li {...springPress} className="rounded-xl overflow-hidden mb-1">
                      <Link
                        to="/notification"
                        className="block px-4 py-2.5 text-sm font-semibold text-sand-700 hover:bg-ocean-50 hover:text-ocean-600 transition-colors duration-200"
                      >
                        Notification
                      </Link>
                    </motion.li>
                    <hr className="border-sand-200/80 my-1" />
                    <motion.li
                      {...springPress}
                      className="rounded-xl overflow-hidden cursor-pointer"
                      onClick={handleLogout}
                    >
                      <span className="block px-4 py-2.5 text-sm font-semibold text-red-650 hover:bg-red-50 transition-colors duration-200">
                        Logout
                      </span>
                    </motion.li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />
    </>
  );
};

export default Navbar;
