import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  HiLocationMarker,
  HiSparkles,
  HiUsers,
  HiChevronDown,
} from "react-icons/hi";
import PageTransition from "../Components/PageTransition";
import {
  staggerContainer,
  fadeUp,
  scaleIn,
  springPress,
} from "../utils/motion";

const Landing = () => {
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 800], [0, 150]);

  return (
    <PageTransition>
      <div className="overflow-x-hidden bg-sand-50">
        
        {/* SECTION 1 — Hero */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          
          {/* Parallax Background */}
          <motion.div
            style={{ y: yParallax }}
            className="absolute inset-0 bg-cover bg-center bg-hero-pattern scale-110 z-0"
          />

          {/* Dark Glass Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/90 via-ocean-950/40 to-ocean-950/10 z-10" />

          {/* Hero Content */}
          <div className="relative z-20 max-w-5xl mx-auto px-6 text-center text-white">
            <motion.div
              variants={staggerContainer(0.12, 0.15)}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center"
            >
              {/* Headline Split */}
              <h1 className="font-display font-bold tracking-tight text-5xl sm:text-6xl md:text-7xl mb-6">
                <motion.span variants={fadeUp} className="block">
                  Your Next Adventure,
                </motion.span>
                <motion.span variants={fadeUp} className="block text-sunset-400">
                  Mapped & Remembered.
                </motion.span>
              </h1>

              {/* Subhead */}
              <motion.p
                variants={fadeUp}
                className="font-sans text-lg md:text-xl text-sand-200/90 max-w-2xl mb-10 leading-relaxed font-normal"
              >
                Access live travel updates, interactive map stories, gamified exploration achievements, and AI-powered recommendations—all in one journal.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <motion.button
                    {...springPress}
                    className="bg-sunset-500 hover:bg-sunset-600 text-white px-8 py-4 rounded-2xl font-semibold text-base shadow-[0_8px_30px_rgba(241,102,58,0.25)] transition-colors duration-300"
                  >
                    Get Started
                  </motion.button>
                </Link>
                <Link to="/login">
                  <motion.button
                    {...springPress}
                    className="border-2 border-white/40 hover:border-white text-white px-8 py-4 rounded-2xl font-semibold text-base backdrop-blur-sm transition-colors duration-300"
                  >
                    Log In
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
            <span className="text-sand-300 text-xs font-semibold tracking-widest uppercase mb-2">
              Explore Differentiators
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              className="text-white text-2xl"
            >
              <HiChevronDown />
            </motion.div>
          </div>
        </section>

        {/* SECTION 2 — Feature Showcase */}
        <section className="py-28 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-5xl text-sand-900">
              Everything You Need to Explore
            </h2>
            <p className="font-sans text-base text-sand-500 mt-4 max-w-xl mx-auto">
              Meet the modern social journal designed to enrich every step of your travel experience.
            </p>
          </div>

          {/* Asymmetric Grid */}
          <motion.div
            variants={staggerContainer(0.1, 0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Card 1: Large col-span-2 card */}
            <motion.div
              variants={fadeUp}
              className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(20,41,57,0.04)] border border-sand-100/80 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-600 mb-6">
                  <HiLocationMarker className="text-2xl" />
                </div>
                <h3 className="font-display font-semibold text-2xl text-sand-900 mb-3">
                  Map-Pinned Travel Stories
                </h3>
                <p className="font-sans text-sand-600 leading-relaxed text-base max-w-2xl">
                  Log your trip milestones with precise geographic coordinates, rich media, and ratings. Your profile turns into a personal travel map, allowing followers to browse your route step-by-step and experience the locations dynamically.
                </p>
              </div>
              <div className="mt-8 border-t border-sand-100 pt-6 flex items-center justify-between text-xs text-sand-400 font-semibold tracking-wider uppercase">
                <span>Featured Core Tool</span>
                <span className="text-ocean-600">Geo Pinned</span>
              </div>
            </motion.div>

            {/* Card 2: AI recommendations */}
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(20,41,57,0.04)] border border-sand-100/80 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-sunset-100 flex items-center justify-center text-sunset-500 mb-6">
                  <HiSparkles className="text-2xl" />
                </div>
                <h3 className="font-display font-semibold text-xl text-sand-900 mb-3">
                  AI-Powered Recommendations
                </h3>
                <p className="font-sans text-sand-600 text-sm leading-relaxed">
                  Never wonder where to go next. Select a province and travel category to receive curated, top-rated destinations matching your profile criteria instantly.
                </p>
              </div>
              <div className="mt-8 border-t border-sand-100 pt-6 flex items-center justify-between text-xs text-sand-400 font-semibold tracking-wider uppercase">
                <span>Travel Advisor</span>
                <span className="text-sunset-500">KNN Engine</span>
              </div>
            </motion.div>

            {/* Card 3: Social & Gamification */}
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(20,41,57,0.04)] border border-sand-100/80 flex flex-col justify-between md:col-span-3 lg:col-span-1"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-jade-100 flex items-center justify-center text-jade-600 mb-6">
                  <HiUsers className="text-2xl" />
                </div>
                <h3 className="font-display font-semibold text-xl text-sand-900 mb-3">
                  Gamified Exploration Feed
                </h3>
                <p className="font-sans text-sand-600 text-sm leading-relaxed">
                  Engage with other travelers, leave comments, and like posts. Earn badges and leveling achievements directly associated with your contributions, posts, and followers.
                </p>
              </div>
              <div className="mt-8 border-t border-sand-100 pt-6 flex items-center justify-between text-xs text-sand-400 font-semibold tracking-wider uppercase">
                <span>Social & Rewards</span>
                <span className="text-jade-600">Badges System</span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION 3 — Dark CTA Band */}
        <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-950 text-white relative overflow-hidden">
          
          {/* Subtle abstract glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ocean-500/10 rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative z-10 max-w-3xl mx-auto text-center"
          >
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight mb-6">
              Start Mapping Your Journeys Today
            </h2>
            <p className="font-sans text-sand-300 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-light">
              Join a growing community of travel enthusiasts mapping their routes, sharing journals, and unlocking achievements.
            </p>
            <Link to="/signup">
              <motion.button
                {...springPress}
                className="bg-sunset-500 hover:bg-sunset-600 text-white px-10 py-4 rounded-2xl font-semibold text-base shadow-[0_8px_30px_rgba(241,102,58,0.35)] transition-colors duration-300"
              >
                Get Started for Free
              </motion.button>
            </Link>
          </motion.div>
        </section>

      </div>
    </PageTransition>
  );
};

export default Landing;