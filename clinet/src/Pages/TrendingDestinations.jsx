import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { CiLocationOn } from "react-icons/ci";
import { TbFlame, TbStar, TbMapPin } from "react-icons/tb";
import { HiOutlinePhotograph } from "react-icons/hi";
import ReactStars from "react-rating-stars-component";
import PageTransition from "../Components/PageTransition";
import PostCardSkeleton from "../Components/PostCardSkeleton";
import { staggerContainer, fadeUp } from "../utils/motion";
import { getTrendingDestinations } from "../Toolkit/slices/trendingSlice";

/* Medal colours for top-3 */
const MEDAL = {
  0: { bg: "from-yellow-400 to-amber-500", text: "text-amber-700", border: "border-yellow-300", label: "🥇 #1" },
  1: { bg: "from-slate-300 to-slate-400",  text: "text-slate-600",  border: "border-slate-200",  label: "🥈 #2" },
  2: { bg: "from-orange-300 to-orange-400",text: "text-orange-700", border: "border-orange-200", label: "🥉 #3" },
};

/* Skeleton card */
const DestSkeleton = () => (
  <div className="bg-white rounded-3xl border border-sand-100 overflow-hidden shadow-sm relative">
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-sand-100/60 to-transparent z-10"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
    />
    <div className="w-full h-44 bg-sand-100" />
    <div className="p-5 space-y-3">
      <div className="h-3 w-16 bg-sand-100 rounded-full" />
      <div className="h-5 w-2/3 bg-sand-100 rounded-lg" />
      <div className="flex justify-between items-center pt-1">
        <div className="h-3 w-1/4 bg-sand-50 rounded" />
        <div className="h-3 w-1/4 bg-sand-50 rounded" />
      </div>
    </div>
  </div>
);

/* Individual destination card */
const DestCard = ({ dest, index, isHovered, onHover }) => {
  const medal = MEDAL[index];
  const isTop3 = index < 3;

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={`group relative bg-white rounded-3xl border overflow-hidden cursor-default transition-all duration-500
        ${isTop3
          ? "border-amber-100 shadow-[0_12px_40px_rgba(245,158,11,0.12)]"
          : "border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.03)]"
        }
        ${isHovered ? "-translate-y-2 shadow-[0_20px_60px_rgb(20,41,57,0.1)]" : ""}
      `}
      style={{ transform: isHovered ? "translateY(-8px)" : undefined }}
    >
      {/* ── Thumbnail ── */}
      <div className="relative w-full h-44 overflow-hidden">
        {dest.thumbnail?.url ? (
          <>
            <img
              src={dest.thumbnail.url}
              alt={dest.location}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            {/* Dark gradient overlay so text is readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-ocean-50 via-sand-100 to-ocean-100 flex flex-col items-center justify-center gap-2">
            <HiOutlinePhotograph className="text-4xl text-sand-300" />
            <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-wider">No photo yet</p>
          </div>
        )}

        {/* Rank badge — floated inside image */}
        <div className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border backdrop-blur-md
          ${isTop3
            ? `bg-gradient-to-r ${medal.bg} ${medal.text} ${medal.border} shadow-md`
            : "bg-white/80 text-ocean-700 border-ocean-100/60"
          }`
        }>
          {isTop3 ? medal.label : `#${index + 1} Trending`}
        </div>

        {/* Post count pill — bottom-left of image */}
        {dest.thumbnail?.url && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <TbMapPin className="text-white text-xs" />
            <span className="text-white text-[10px] font-bold">
              {dest.postCount} {dest.postCount === 1 ? "post" : "posts"}
            </span>
          </div>
        )}

        {/* Flame icon on hover — top-right */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-orange-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <TbFlame className="text-white text-base" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Card Body ── */}
      <div className="p-5">
        <h3 className="font-display font-extrabold text-sand-900 text-base leading-snug line-clamp-1 flex items-center gap-1.5 mb-3">
          <CiLocationOn className="text-ocean-500 text-lg flex-shrink-0" />
          {dest.location}
        </h3>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          {!dest.thumbnail?.url && (
            <span className="font-sans text-xs text-sand-500 font-semibold">
              {dest.postCount} {dest.postCount === 1 ? "post" : "posts"}
            </span>
          )}
          {dest.avgRating != null && (
            <div className="flex items-center gap-1.5 ml-auto">
              <ReactStars
                count={5}
                value={Math.round(dest.avgRating * 2) / 2}
                size={14}
                activeColor="#41789f"
                edit={false}
                isHalf={true}
              />
              <span className="text-[11px] font-bold text-sand-500 bg-sand-50 px-1.5 py-0.5 rounded-md">
                {dest.avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar (visual flair — relative to top destination) */}
        <div className="mt-4 h-1 bg-sand-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, 40 + dest.postCount * 8)}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${isTop3 ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-ocean-400 to-ocean-600"}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

const TrendingDestinations = () => {
  const dispatch = useDispatch();
  const { destinations, status } = useSelector((state) => state.trending);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    dispatch(getTrendingDestinations());
  }, [dispatch]);

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-24">

        {/* ── Premium Hero Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-ocean-900 via-ocean-700 to-ocean-500 pt-24 pb-16">
          {/* Decorative orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-orange-400/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-ocean-400/20 blur-2xl translate-y-1/2 -translate-x-1/4" />
          {/* Subtle dot-grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
            {/* Flame badge */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
            >
              <TbFlame className="text-orange-300 text-base" />
              <span className="text-orange-200 text-xs font-bold uppercase tracking-widest">Most Visited Destinations</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display font-extrabold text-4xl md:text-5xl text-white leading-tight mb-4"
            >
              Trending <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-200">Destinations</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="text-ocean-200 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed"
            >
              The most-posted locations from the Traveler community — real experiences, real places.
            </motion.p>

            {/* Live count pill */}
            {destinations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="inline-flex items-center gap-2 mt-6 bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white text-xs font-semibold">{destinations.length} places trending now</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Card Grid ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
          {status === "loading" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
              {Array.from({ length: 6 }).map((_, i) => <DestSkeleton key={i} />)}
            </div>
          ) : destinations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-16 border border-sand-100 text-center shadow-sm mt-6 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-ocean-50 border border-ocean-100 flex items-center justify-center">
                <CiLocationOn className="text-3xl text-ocean-400" />
              </div>
              <div>
                <p className="font-display font-bold text-lg text-sand-700">No destinations yet</p>
                <p className="text-sm text-sand-400 mt-1">Start posting from your travels and they'll appear here!</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer(0.06, 0.04)}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6"
            >
              {destinations.map((dest, index) => (
                <DestCard
                  key={`${dest.location}-${index}`}
                  dest={dest}
                  index={index}
                  isHovered={hoveredIndex === index}
                  onHover={setHoveredIndex}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default TrendingDestinations;
