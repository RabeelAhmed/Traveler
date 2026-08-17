import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CiLocationOn } from "react-icons/ci";
import { TbFlame, TbStar, TbMapPin, TbSearch, TbX, TbSparkles } from "react-icons/tb";
import { HiOutlinePhotograph } from "react-icons/hi";
import ReactStars from "react-rating-stars-component";
import PageTransition from "../Components/PageTransition";
import { staggerContainer, fadeUp } from "../utils/motion";
import { getTrendingDestinations } from "../Toolkit/slices/trendingSlice";

/* Helper to capitalize location names (e.g. "sialkot" -> "Sialkot") */
const formatLocationName = (str) => {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/* Medal colours for top-3 rankings */
const MEDAL = {
  0: {
    bg: "from-amber-400 via-amber-500 to-yellow-500",
    text: "text-amber-950 font-black",
    border: "border-amber-300",
    label: "🥇 #1 Trending",
    glow: "shadow-[0_4px_20px_rgba(245,158,11,0.35)]",
  },
  1: {
    bg: "from-slate-200 via-slate-300 to-slate-400",
    text: "text-slate-900 font-black",
    border: "border-slate-100",
    label: "🥈 #2 Trending",
    glow: "shadow-[0_4px_20px_rgba(148,163,184,0.3)]",
  },
  2: {
    bg: "from-amber-600 via-orange-600 to-amber-700",
    text: "text-white font-black",
    border: "border-amber-400",
    label: "🥉 #3 Trending",
    glow: "shadow-[0_4px_20px_rgba(217,119,6,0.3)]",
  },
};

/* Skeleton card during loading */
const DestSkeleton = () => (
  <div className="bg-white rounded-3xl border border-sand-200/80 overflow-hidden shadow-sm relative">
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-sand-100/70 to-transparent z-10"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
    />
    <div className="w-full h-48 sm:h-52 bg-sand-200/60" />
    <div className="p-5 sm:p-6 space-y-3">
      <div className="h-4 w-1/3 bg-sand-200/70 rounded-full" />
      <div className="h-6 w-2/3 bg-sand-200/70 rounded-lg" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 w-1/4 bg-sand-100 rounded" />
        <div className="h-4 w-1/3 bg-sand-100 rounded" />
      </div>
    </div>
  </div>
);

/* Individual destination card */
const DestCard = ({ dest, index, isHovered, onHover, onClick }) => {
  const medal = MEDAL[index];
  const isTop3 = index < 3;
  const formattedTitle = formatLocationName(dest.location);

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      className={`group relative bg-white rounded-3xl border overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between
        ${isTop3
          ? "border-amber-200/90 shadow-[0_10px_30px_rgba(245,158,11,0.08)] hover:shadow-[0_20px_45px_rgba(245,158,11,0.18)]"
          : "border-sand-200/80 shadow-[0_4px_20px_rgba(20,41,57,0.04)] hover:shadow-[0_16px_36px_rgba(20,41,57,0.1)]"
        }
      `}
      whileHover={{ y: -6 }}
    >
      <div>
        {/* ── Thumbnail Container ── */}
        <div className="relative w-full h-48 sm:h-52 md:h-56 overflow-hidden bg-sand-100">
          {dest.thumbnail?.url ? (
            <>
              <img
                src={dest.thumbnail.url}
                alt={formattedTitle}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                loading="lazy"
              />
              {/* Vignette gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/80 via-ocean-950/20 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-75" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-ocean-100 via-sand-100 to-ocean-200 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <HiOutlinePhotograph className="text-4xl text-ocean-400/80" />
              <p className="text-xs font-bold text-ocean-700 uppercase tracking-wider">No photos yet</p>
            </div>
          )}

          {/* Rank Badge — Top Left */}
          <div className="absolute top-3 left-3 z-10">
            {isTop3 ? (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border bg-gradient-to-r ${medal.bg} ${medal.text} ${medal.border} ${medal.glow}`}>
                {medal.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-ocean-950/75 text-white border border-white/20 backdrop-blur-md shadow-md">
                #{index + 1} Trending
              </span>
            )}
          </div>

          {/* Post count pill — Bottom Left */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-ocean-950/75 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full shadow-sm">
            <TbMapPin className="text-sunset-400 text-xs" />
            <span className="text-white text-xs font-bold">
              {dest.postCount} {dest.postCount === 1 ? "post" : "posts"}
            </span>
          </div>

          {/* Flame icon indicator — Top Right */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-sunset-500 text-white backdrop-blur-md flex items-center justify-center shadow-lg shadow-sunset-500/40 z-10"
              >
                <TbFlame className="text-lg animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Card Content ── */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-display font-extrabold text-ocean-900 text-lg sm:text-xl leading-snug line-clamp-1 flex items-center gap-2 group-hover:text-ocean-600 transition-colors">
              <CiLocationOn className="text-sunset-500 text-xl flex-shrink-0" />
              <span>{formattedTitle}</span>
            </h3>
          </div>

          {/* Stats & Rating */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-sand-500">
              Community Rating
            </span>
            {dest.avgRating != null ? (
              <div className="flex items-center gap-1.5">
                <ReactStars
                  count={5}
                  value={Math.round(dest.avgRating * 2) / 2}
                  size={15}
                  activeColor="#f1663a"
                  edit={false}
                  isHalf={true}
                />
                <span className="text-xs font-extrabold text-ocean-900 bg-sand-100 px-2 py-0.5 rounded-md border border-sand-200/60">
                  {dest.avgRating.toFixed(1)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-sand-400 font-medium italic">Unrated</span>
            )}
          </div>

          {/* Popularity Progress Bar */}
          <div className="mt-4 pt-2 border-t border-sand-100">
            <div className="flex justify-between items-center text-[10px] text-sand-400 font-bold uppercase tracking-wider mb-1.5">
              <span>Popularity</span>
              <span>{Math.min(100, Math.round(dest.postCount * 15))}%</span>
            </div>
            <div className="h-1.5 w-full bg-sand-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(15, dest.postCount * 15))}%` }}
                transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                className={`h-full rounded-full ${isTop3
                  ? "bg-gradient-to-r from-sunset-400 to-amber-400"
                  : "bg-gradient-to-r from-ocean-400 to-ocean-600"
                  }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Bar */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
        <div className="w-full py-2.5 px-4 rounded-xl bg-sand-50 hover:bg-ocean-50 text-ocean-700 font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-sand-200/60 group-hover:border-ocean-200 group-hover:text-ocean-900">
          <span>Explore {formattedTitle}</span>
          <span className="text-base leading-none">→</span>
        </div>
      </div>
    </motion.div>
  );
};

const TrendingDestinations = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { destinations, status } = useSelector((state) => state.trending);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(getTrendingDestinations());
  }, [dispatch]);

  /* Filtered destinations based on search query */
  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return destinations;
    return destinations.filter((dest) =>
      dest.location.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [destinations, searchQuery]);

  const handleCardClick = (location) => {
    const formatted = formatLocationName(location);
    navigate(`/search?query=${encodeURIComponent(formatted)}`);
  };

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-24">
        {/* ── Hero Header Banner ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800 pt-24 pb-12 text-white">
          {/* Decorative ambient background glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-sunset-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 rounded-full bg-ocean-400/20 blur-3xl pointer-events-none" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
            {/* Header Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              className="inline-flex items-center gap-2 bg-sunset-500/20 border border-sunset-400/30 backdrop-blur-md px-4 py-2 rounded-full mb-6"
            >
              <TbFlame className="text-sunset-400 text-lg animate-pulse" />
              <span className="text-sunset-200 text-xs font-bold tracking-widest uppercase">
                Most Visited Destinations
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white leading-tight mb-4 tracking-tight"
            >
              Trending{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset-300 via-sunset-400 to-amber-300">
                Destinations
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="text-ocean-200 text-sm sm:text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed mb-8"
            >
              Discover the most-shared locations from the Traveler community — real photos, honest reviews, and authentic travel experiences.
            </motion.p>

            {/* Search & Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="max-w-md mx-auto relative mb-6"
            >
              <div className="relative flex items-center">
                <TbSearch className="absolute left-4 text-ocean-300 text-xl pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search trending places (e.g. Lahore, Hunza)..."
                  className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-ocean-200/70 text-sm font-medium backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-sunset-400/60 focus:bg-white/15 transition-all shadow-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 p-1 text-ocean-300 hover:text-white rounded-full transition-colors"
                  >
                    <TbX className="text-lg" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Live Count Pill */}
            {destinations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-md px-4 py-1.5 rounded-full text-xs text-white font-semibold shadow-inner"
              >
                <span className="w-2 h-2 rounded-full bg-jade-400 animate-pulse" />
                <span>
                  {filteredDestinations.length} of {destinations.length} trending locations
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 relative z-20">
          {status === "loading" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <DestSkeleton key={i} />
              ))}
            </div>
          ) : filteredDestinations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-12 sm:p-16 border border-sand-200/80 text-center shadow-lg mt-6 flex flex-col items-center gap-4 max-w-lg mx-auto"
            >
              <div className="w-16 h-16 rounded-3xl bg-ocean-50 border border-ocean-100 flex items-center justify-center">
                <CiLocationOn className="text-3xl text-sunset-500" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-ocean-900">
                  {searchQuery ? "No matching locations" : "No destinations yet"}
                </h3>
                <p className="text-sm text-sand-500 mt-1.5 leading-relaxed">
                  {searchQuery
                    ? `No trending places match "${searchQuery}". Try searching for another city!`
                    : "Be the first to post travel stories and bring locations to life on Traveler!"}
                </p>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 px-5 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
                >
                  Clear Search Filter
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer(0.06, 0.04)}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6"
            >
              {filteredDestinations.map((dest, index) => (
                <DestCard
                  key={`${dest.location}-${index}`}
                  dest={dest}
                  index={index}
                  isHovered={hoveredIndex === index}
                  onHover={setHoveredIndex}
                  onClick={() => handleCardClick(dest.location)}
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
