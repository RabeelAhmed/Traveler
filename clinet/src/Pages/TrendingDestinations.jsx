import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { CiLocationOn } from "react-icons/ci";
import ReactStars from "react-rating-stars-component";
import Header from "../Components/Header";
import PostCardSkeleton from "../Components/PostCardSkeleton";
import PageTransition from "../Components/PageTransition";
import { staggerContainer, fadeUp } from "../utils/motion";
import { getTrendingDestinations } from "../Toolkit/slices/trendingSlice";

const TrendingDestinations = () => {
  const dispatch = useDispatch();
  const { destinations, status } = useSelector((state) => state.trending);

  useEffect(() => {
    dispatch(getTrendingDestinations());
  }, [dispatch]);

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        <Header
          title="Trending Destinations"
          subtitle="The most-posted locations from the Traveler community — real experiences, real places."
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
          {status === "loading" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer(0.06, 0.04)}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {destinations.length > 0 ? (
                destinations.map((dest, index) => (
                  <motion.div
                    key={`${dest.location}-${index}`}
                    variants={fadeUp}
                    className="bg-white rounded-3xl border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.02)] overflow-hidden cursor-default hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    {dest.thumbnail?.url ? (
                      <div className="w-full h-40 overflow-hidden">
                        <img
                          src={dest.thumbnail.url}
                          alt={dest.location}
                          className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700 ease-out"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-sand-100 flex items-center justify-center rounded-t-3xl">
                        <CiLocationOn className="text-5xl text-sand-300" />
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-5">
                      {/* Rank badge */}
                      <span className="inline-block text-[10px] font-bold text-ocean-600 bg-ocean-50 border border-ocean-100/50 rounded-full px-2.5 py-0.5 uppercase tracking-wider mb-3">
                        #{index + 1} Trending
                      </span>

                      <h3 className="font-display font-extrabold text-base text-sand-900 mb-1 leading-snug line-clamp-1 flex items-center gap-1.5">
                        <CiLocationOn className="text-ocean-500 text-lg flex-shrink-0" />
                        {dest.location}
                      </h3>

                      {/* Stats row */}
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-sans text-xs text-sand-500 font-semibold">
                          {dest.postCount} {dest.postCount === 1 ? "post" : "posts"}
                        </span>
                        {dest.avgRating != null && (
                          <div className="flex items-center gap-1">
                            <ReactStars
                              count={5}
                              value={Math.round(dest.avgRating * 2) / 2}
                              size={16}
                              activeColor="#41789f"
                              edit={false}
                              isHalf={true}
                            />
                            <span className="text-[10px] font-semibold text-sand-400">
                              {dest.avgRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  variants={fadeUp}
                  className="col-span-3 bg-white rounded-3xl p-12 border border-sand-100 text-center text-sand-500 font-sans shadow-[0_8px_30px_rgb(20,41,57,0.01)] flex flex-col items-center"
                >
                  <CiLocationOn className="text-5xl text-sand-300 mb-3" />
                  <p className="font-semibold text-sand-600">No destinations found yet.</p>
                  <p className="text-xs text-sand-400 mt-1">
                    Start posting about your travels to see them here!
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default TrendingDestinations;
