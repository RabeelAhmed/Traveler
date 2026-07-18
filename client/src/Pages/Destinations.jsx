import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoSearchSharp } from "react-icons/io5";
import { HiLocationMarker, HiStar, HiFolderOpen } from "react-icons/hi";
import Header from "../Components/Header";
import PageTransition from "../Components/PageTransition";
import Breadcrumbs from "../Components/Breadcrumbs";
import SEO from "../Components/SEO";
import Loader from "../Components/Loader";
import { axiosClient } from "../utils/axiosClient";
import { fadeUp, staggerContainer, springPress } from "../utils/motion";

const Destinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await axiosClient.get("/destinations");
        if (response.data && response.data.success) {
          setDestinations(response.data.data.destinations);
        }
      } catch (err) {
        console.error("Error fetching destinations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  const categories = ["All", ...new Set(destinations.map((d) => d.category).filter(Boolean))];

  const filtered = destinations.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || d.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageTransition>
      <SEO
        title="Explore Pakistan Destinations & Travel Guides | Traveler"
        description="Browse through 69 stunning travel destinations, lakes, valleys, forts, and national parks in Pakistan. Read ratings, traveler reviews, and guides."
        path="/destinations"
      />
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        <Header
          title="Travel Destinations"
          subtitle="Explore community-reviewed guides and travel logs for 69 iconic Pakistani destinations."
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 text-left">
          <Breadcrumbs
            items={[
              { label: "Home", url: "/home" },
              { label: "Destinations", url: "/destinations" },
            ]}
          />

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sand-400">
                <IoSearchSharp className="text-xl" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, district, or region..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-sand-200 focus:outline-none focus:border-ocean-500 shadow-sm text-sand-800 transition-colors text-sm font-sans"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide select-none max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                    activeCategory === cat
                      ? "bg-ocean-600 text-white shadow-sm"
                      : "bg-white text-sand-500 border border-sand-150 hover:bg-sand-100/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader />
            </div>
          ) : (
            <motion.div
              variants={staggerContainer(0.05, 0.05)}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {filtered.map((dest) => (
                  <motion.div
                    key={dest._id}
                    variants={fadeUp}
                    whileHover={{ y: -6, scale: 1.01 }}
                    className="bg-white rounded-3xl border border-sand-100 shadow-[0_8px_30px_rgb(20,41,57,0.02)] overflow-hidden flex flex-col justify-between"
                  >
                    <Link to={`/destinations/${dest.slug}`} className="flex-1 flex flex-col p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-ocean-650 bg-ocean-50 px-2.5 py-1 rounded-lg">
                          {dest.category}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-sand-500 bg-sand-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <HiLocationMarker className="text-xs" />
                          {dest.district}
                        </span>
                      </div>

                      <h2 className="font-display font-bold text-lg text-sand-900 leading-tight mb-2 hover:text-ocean-650 transition-colors">
                        {dest.name}
                      </h2>

                      <p className="text-xs text-sand-500 font-sans line-clamp-3 mb-4 flex-1">
                        {dest.description}
                      </p>

                      <div className="flex items-center justify-between border-t border-sand-50 pt-4 mt-auto">
                        <div className="flex items-center gap-1 text-xs font-semibold text-sand-700">
                          <HiStar className="text-sunset-500 text-base" />
                          <span>{dest.avgRating > 0 ? dest.avgRating : "No reviews"}</span>
                        </div>
                        <span className="text-[10px] text-sand-400 font-medium">
                          {dest.reviewCount} {dest.reviewCount === 1 ? "review" : "reviews"}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-sand-100/80 p-8 shadow-[0_8px_30px_rgb(20,41,57,0.01)]">
              <HiFolderOpen className="text-5xl text-sand-300 mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg text-sand-800">No destinations found</h3>
              <p className="text-xs text-sand-450 mt-1 max-w-sm mx-auto">
                We couldn't find any destinations matching "{searchQuery}" under the selected category.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Destinations;
