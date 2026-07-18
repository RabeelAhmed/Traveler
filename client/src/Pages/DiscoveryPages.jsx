import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiLocationMarker, HiStar, HiSparkles, HiShieldCheck } from "react-icons/hi";
import Header from "../Components/Header";
import PageTransition from "../Components/PageTransition";
import Breadcrumbs from "../Components/Breadcrumbs";
import SEO from "../Components/SEO";
import Loader from "../Components/Loader";
import { axiosClient } from "../utils/axiosClient";
import { fadeUp, staggerContainer } from "../utils/motion";

const DiscoveryPages = () => {
  const { pathname } = useLocation();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set page-specific content configuration dynamically based on pathname
  let pageConfig = {
    title: "Travel Guides",
    subtitle: "Browse expert travel guides and detailed itineraries across Pakistan.",
    type: "most-reviewed",
    seoTitle: "Pakistan Travel Guides & Expert Itineraries | Traveler",
    seoDesc: "Access hand-picked travel guides, reviews, road trip itineraries, and recommendations for destinations across Pakistan.",
  };

  if (pathname === "/top-rated-destinations") {
    pageConfig = {
      title: "Top Rated Destinations",
      subtitle: "Discover the highest-rated places in Pakistan based on traveler reviews.",
      type: "top-rated",
      seoTitle: "Highest Rated Pakistan Travel Destinations | Traveler",
      seoDesc: "Explore top-rated travel destinations in Pakistan voted by our global community. Check ratings and reviews.",
    };
  } else if (pathname === "/hidden-gems-pakistan") {
    pageConfig = {
      title: "Hidden Gems of Pakistan",
      subtitle: "Uncover pristine, off-the-beaten-path locations with excellent visitor feedback.",
      type: "hidden-gems",
      seoTitle: "Hidden Gems & Unexplored Places in Pakistan | Traveler",
      seoDesc: "Find unexplored waterfalls, remote lakes, and hidden scenic spots in Pakistan rated highly by travelers.",
    };
  } else if (pathname === "/travel-tips") {
    pageConfig = {
      title: "Pakistan Travel Tips",
      subtitle: "Essential visitor guides, safety tips, and travel logs from active adventurers.",
      type: "recently-reviewed",
      seoTitle: "Pakistan Travel Tips, FAQs & Packing Guides | Traveler",
      seoDesc: "Get the latest Pakistan travel tips, FAQs, transport guides, and safety tips shared by real travelers.",
    };
  }

  useEffect(() => {
    const fetchCurated = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/destinations/curated/${pageConfig.type}`);
        if (response.data && response.data.success) {
          setDestinations(response.data.data.destinations);
        }
      } catch (err) {
        console.error("Error fetching curated destinations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurated();
  }, [pathname]);

  return (
    <PageTransition>
      <SEO
        title={pageConfig.seoTitle}
        description={pageConfig.seoDesc}
        path={pathname}
      />
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        <Header title={pageConfig.title} subtitle={pageConfig.subtitle} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 text-left">
          <Breadcrumbs
            items={[
              { label: "Home", url: "/home" },
              { label: "Destinations", url: "/destinations" },
              { label: pageConfig.title },
            ]}
          />

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader />
            </div>
          ) : (
            <motion.div
              variants={staggerContainer(0.05, 0.05)}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {destinations.map((dest) => (
                <motion.div
                  key={dest._id}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl border border-sand-100 shadow-[0_8px_30px_rgb(20,41,57,0.02)] overflow-hidden flex flex-col p-6 relative group"
                >
                  {/* Decorative badge for top rated / hidden gems */}
                  {pageConfig.type === "top-rated" && (
                    <div className="absolute top-6 right-6 text-sunset-500 bg-sunset-50 p-2 rounded-full shadow-inner">
                      <HiShieldCheck className="text-lg" />
                    </div>
                  )}
                  {pageConfig.type === "hidden-gems" && (
                    <div className="absolute top-6 right-6 text-emerald-500 bg-emerald-50 p-2 rounded-full shadow-inner">
                      <HiSparkles className="text-lg" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-ocean-650 bg-ocean-50 px-2.5 py-1.5 rounded-xl">
                      {dest.category}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-sand-500 bg-sand-100 px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                      <HiLocationMarker className="text-xs" />
                      {dest.district}
                    </span>
                  </div>

                  <h2 className="font-display font-bold text-lg text-sand-900 leading-tight mb-2 group-hover:text-ocean-650 transition-colors">
                    {dest.name}
                  </h2>

                  <p className="text-xs text-sand-500 font-sans line-clamp-3 mb-6 flex-1">
                    {dest.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-sand-50 pt-4 mt-auto">
                    <div className="flex items-center gap-1 text-xs font-semibold text-sand-700">
                      <HiStar className="text-sunset-500 text-base" />
                      <span>{dest.avgRating > 0 ? dest.avgRating : "Unrated"}</span>
                    </div>
                    <Link
                      to={`/destinations/${dest.slug}`}
                      className="text-xs font-bold text-ocean-600 hover:text-ocean-700 flex items-center gap-1"
                    >
                      View Guide &rarr;
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && destinations.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-sand-100 p-8 shadow-[0_8px_30px_rgb(20,41,57,0.01)]">
              <p className="text-xs text-sand-400">No destinations available in this curated listing yet.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default DiscoveryPages;
