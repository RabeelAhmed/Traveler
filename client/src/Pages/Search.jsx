import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoSearchSharp } from "react-icons/io5";
import { axiosClient } from "../utils/axiosClient";
import PostCard from "../Components/PostCard";
import ProfileCard from "../Components/ProfileCard";
import PostCardSkeleton from "../Components/PostCardSkeleton";
import Header from "../Components/Header";
import PageTransition from "../Components/PageTransition";
import SEO from "../Components/SEO";
import { springPress, fadeUp, staggerContainer } from "../utils/motion";

const Search = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [filter, setFilter] = useState("all"); // all | users | posts
  const [sortOrder, setSortOrder] = useState("latest"); // latest | oldest
  const query = searchParams.get("query");

  const handleSearch = () => {
    const trimmedQuery = searchTerm.trim();
    if (trimmedQuery) {
      const encoded = encodeURIComponent(trimmedQuery);
      setSearchParams({ query: encoded });
    }
  };

  useEffect(() => {
    if (!query) return;

    const decodedQuery = decodeURIComponent(query);
    setSearchTerm(decodedQuery);

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/post/search?query=${encodeURIComponent(decodedQuery)}`);
        setSearchResults(res.data.result);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  // Parse timeAgo string into minutes for sorting
  const parseTimeAgo = (timeAgo) => {
    if (!timeAgo) return Number.MAX_SAFE_INTEGER;
    const [amountStr, unit] = timeAgo.split(" ");
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount)) return Number.MAX_SAFE_INTEGER;

    switch (unit) {
      case "minute":
      case "minutes":
        return amount;
      case "hour":
      case "hours":
        return amount * 60;
      case "day":
      case "days":
        return amount * 60 * 24;
      case "week":
      case "weeks":
        return amount * 60 * 24 * 7;
      case "month":
      case "months":
        return amount * 60 * 24 * 30;
      case "year":
      case "years":
        return amount * 60 * 24 * 365;
      default:
        return Number.MAX_SAFE_INTEGER;
    }
  };

  // Sort posts based on timeAgo
  const getSortedPosts = () => {
    if (!searchResults.posts) return [];

    return [...searchResults.posts].sort((a, b) => {
      const aMinutes = parseTimeAgo(a.timeAgo);
      const bMinutes = parseTimeAgo(b.timeAgo);
      return sortOrder === "latest" ? aMinutes - bMinutes : bMinutes - aMinutes;
    });
  };

  const sortedPosts = getSortedPosts();
  const hasUsers = searchResults.users?.length > 0;
  const hasPosts = sortedPosts.length > 0;

  return (
    <PageTransition>
      <SEO title="Search | Traveler" noindex={true} path="/search" />
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        
        {/* Editorial Header */}
        <Header
          title="Search"
          subtitle="Explore specific tags, traveler profiles, and global search keywords."
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex flex-col gap-6 text-left">
          
          {/* Expanded Command-Bar Search Input */}
          <motion.div
            animate={{
              scale: isFocused ? 1.015 : 1,
              boxShadow: isFocused
                ? "0 12px 30px rgba(20,41,57,0.06)"
                : "0 8px 24px rgba(20,41,57,0.01)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative flex items-center w-full max-w-xl mx-auto bg-white border border-sand-200/80 rounded-2xl overflow-hidden"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Search users, tags, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="w-full pl-12 pr-12 py-4 bg-transparent outline-none text-sand-850 placeholder-sand-400 font-sans text-base"
            />
            <IoSearchSharp
              className="text-2xl absolute right-4 text-sand-400 cursor-pointer hover:text-ocean-600 transition-colors"
              onClick={handleSearch}
            />
          </motion.div>

          {/* Type Filter Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
            
            {/* Sliding Underline Tabs */}
            <div className="flex bg-white border border-sand-200/80 rounded-full p-1 relative max-w-xs w-full justify-around select-none">
              {["all", "users", "posts"].map((type) => {
                const isActive = filter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`relative z-10 px-5 py-2 text-xs font-display font-bold uppercase tracking-wider transition-colors duration-300 ${
                      isActive ? "text-ocean-600" : "text-sand-400 hover:text-sand-700"
                    }`}
                  >
                    <span>{type}</span>
                    {isActive && (
                      <motion.div
                        layoutId="search-filter-pill"
                        className="absolute inset-0 bg-ocean-50 rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown (Fades in if filtering posts) */}
            <div className="min-h-[40px] flex items-center">
              <AnimatePresence>
                {filter === "posts" && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-[10px] font-sans font-bold text-sand-400 uppercase tracking-widest">
                      Sort:
                    </span>
                    <select
                      className="border border-sand-200/80 rounded-xl px-3 py-1.5 bg-white text-sand-600 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-300 transition-all shadow-sm"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option value="latest">Latest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Query Header Title */}
          {query && (
            <h2 className="font-display font-semibold text-lg text-sand-900 mt-2">
              Results for: <span className="text-ocean-600 font-bold">"{decodeURIComponent(query)}"</span>
            </h2>
          )}

          {/* Search Result Lists */}
          <div className="w-full mt-2">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Users block */}
                {(filter === "all" || filter === "users") && (
                  <AnimatePresence mode="wait">
                    {hasUsers ? (
                      <motion.div
                        key="users-grid"
                        variants={staggerContainer(0.06, 0.04)}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        <h3 className="font-display font-semibold text-xs text-sand-400 uppercase tracking-wider mb-2">
                          Traveler Profiles ({searchResults.users.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {searchResults.users.map((user) => (
                            <motion.div key={user._id} variants={fadeUp}>
                              <ProfileCard user={user} />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ) : filter === "users" ? (
                      <motion.div
                        key="no-users"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto"
                      >
                        <IoSearchSharp className="text-sand-300 text-6xl mb-4 animate-pulse" />
                        <h4 className="font-display font-semibold text-base text-sand-800 mb-1.5">
                          No travelers found
                        </h4>
                        <p className="font-sans text-xs text-sand-500 leading-relaxed">
                          We couldn't find any profiles matching your query. Try checking spelling or search for general names.
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}

                {/* Posts block */}
                {(filter === "all" || filter === "posts") && (
                  <AnimatePresence mode="wait">
                    {hasPosts ? (
                      <motion.div
                        key="posts-grid"
                        variants={staggerContainer(0.06, 0.04)}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        <h3 className="font-display font-semibold text-xs text-sand-400 uppercase tracking-wider mb-2">
                          Travel Journeys ({sortedPosts.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {sortedPosts.map((post) => (
                            <motion.div key={post.id} variants={fadeUp}>
                              <PostCard post={post} />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ) : filter === "posts" ? (
                      <motion.div
                        key="no-posts"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto"
                      >
                        <IoSearchSharp className="text-sand-300 text-6xl mb-4 animate-pulse" />
                        <h4 className="font-display font-semibold text-base text-sand-800 mb-1.5">
                          No journeys found
                        </h4>
                        <p className="font-sans text-xs text-sand-500 leading-relaxed">
                          No post topics or tags matched your search query. Try typing general terms like #hiking, beach, or mountains.
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}

                {/* Combined Empty state when both are blank and filter is "all" */}
                {filter === "all" && !hasUsers && !hasPosts && query && (
                  <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
                    <IoSearchSharp className="text-sand-300 text-6xl mb-4 animate-pulse" />
                    <h4 className="font-display font-semibold text-base text-sand-800 mb-1.5">
                      No search matches found
                    </h4>
                    <p className="font-sans text-xs text-sand-500 leading-relaxed">
                      We couldn't find any profiles or journals matching "{decodeURIComponent(query)}". Try a different search term or check tag spelling.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Search;
