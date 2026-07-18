import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiLocationMarker, HiStar, HiArrowRight, HiMap, HiGlobeAlt } from "react-icons/hi";
import Header from "../Components/Header";
import PageTransition from "../Components/PageTransition";
import Breadcrumbs from "../Components/Breadcrumbs";
import SEO from "../Components/SEO";
import Loader from "../Components/Loader";
import PostCard from "../Components/PostCard";
import ReviewCard from "../Components/ReviewCard";
import { axiosClient } from "../utils/axiosClient";
import { fadeUp, staggerContainer } from "../utils/motion";

const DestinationDetail = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/destinations/${slug}`);
        if (response.data && response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching destination details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-sand-50">
        <Loader />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-sand-50 p-6">
        <h2 className="font-display font-bold text-2xl text-sand-905 mb-2">Destination Not Found</h2>
        <p className="text-sm text-sand-500 mb-6">The requested destination does not exist or has been removed.</p>
        <Link to="/destinations" className="px-6 py-3 rounded-2xl bg-ocean-600 text-white font-semibold shadow-sm hover:bg-ocean-700">
          Back to Destinations
        </Link>
      </div>
    );
  }

  const { destination, avgRating, reviewCount, reviews, relatedPosts, relatedJourneys, nearbyDestinations } = data;

  // JSON-LD schema configurations
  const placeSchema = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": destination.name,
    "description": destination.description,
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": destination.location.latitude,
      "longitude": destination.location.longitude
    },
    "category": destination.category
  };

  const touristSchema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": destination.name,
    "description": destination.description,
    "touristType": "Sightseeing",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": destination.district,
      "addressCountry": "PK"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (destination.faq || []).map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  };

  const ratingSchema = avgRating > 0 ? {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "itemReviewed": {
      "@type": "LocalBusiness",
      "name": destination.name,
      "image": relatedPosts[0]?.media?.[0]?.url || "https://traveler-social.netlify.app/Logo.png"
    },
    "ratingValue": avgRating,
    "bestRating": 5,
    "worstRating": 1,
    "ratingCount": reviewCount
  } : null;

  return (
    <PageTransition>
      <SEO
        title={`${destination.name} Travel Guide, Reviews & Travel Tips | Traveler`}
        description={`Explore ${destination.name} travel reviews, attractions, visitor ratings, and travel tips on Traveler.`}
        path={`/destinations/${slug}`}
      >
        <script type="application/ld+json">{JSON.stringify(placeSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(touristSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        {ratingSchema && <script type="application/ld+json">{JSON.stringify(ratingSchema)}</script>}
      </SEO>

      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 text-left">
          <Breadcrumbs
            items={[
              { label: "Home", url: "/home" },
              { label: "Destinations", url: "/destinations" },
              { label: destination.name },
            ]}
          />

          {/* Hero Banner Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 mb-10 items-start">
            
            {/* Left Block - General Details */}
            <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-[0_8px_30px_rgb(20,41,57,0.02)] p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3.5 mb-4">
                <span className="text-xs uppercase tracking-wider font-extrabold text-ocean-650 bg-ocean-50 px-3 py-1.5 rounded-xl">
                  {destination.category}
                </span>
                <span className="text-xs uppercase tracking-wider font-extrabold text-sand-500 bg-sand-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                  <HiLocationMarker className="text-sm" />
                  {destination.district}
                </span>
              </div>

              <h1 className="font-display font-extrabold text-3xl md:text-4xl text-sand-900 leading-tight mb-4">
                {destination.name}
              </h1>

              <div className="flex items-center gap-4.5 mb-6 border-b border-sand-100 pb-5">
                <div className="flex items-center gap-1">
                  <HiStar className="text-sunset-500 text-xl" />
                  <span className="font-bold text-lg text-sand-850">
                    {avgRating > 0 ? avgRating : "Unrated"}
                  </span>
                </div>
                <span className="text-xs text-sand-400 font-medium">
                  Based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>

              <div className="flex gap-4 border-b border-sand-100 pb-4 mb-6 scrollbar-hide overflow-x-auto select-none">
                {["overview", "reviews", "posts", "journeys"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2.5 text-sm font-semibold capitalize transition-all border-b-2 whitespace-nowrap ${
                      activeTab === tab
                        ? "border-ocean-600 text-ocean-700 font-bold"
                        : "border-transparent text-sand-400 hover:text-sand-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div>
                {activeTab === "overview" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div>
                      <h2 className="font-display font-bold text-lg text-sand-850 mb-3">About the Destination</h2>
                      <p className="text-sm text-sand-600 leading-relaxed font-sans">{destination.description}</p>
                    </div>

                    {/* FAQ Collapsible Sections */}
                    {destination.faq && destination.faq.length > 0 && (
                      <div>
                        <h2 className="font-display font-bold text-lg text-sand-850 mb-4">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                          {destination.faq.map((f, i) => (
                            <div key={i} className="border border-sand-150 rounded-2xl p-4.5 bg-sand-50/50">
                              <h3 className="font-semibold text-sm text-sand-850 mb-1.5 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-ocean-50 text-ocean-600 flex items-center justify-center text-[10px] font-bold">Q</span>
                                {f.question}
                              </h3>
                              <p className="text-xs text-sand-550 pl-7 leading-relaxed font-sans">{f.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "reviews" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <h2 className="font-display font-bold text-lg text-sand-850 mb-4">Traveler Reviews</h2>
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <ReviewCard key={review._id} review={review} />
                      ))
                    ) : (
                      <p className="text-xs text-sand-450 italic py-6">No reviews shared for {destination.name} yet. Be the first to share one!</p>
                    )}
                  </motion.div>
                )}

                {activeTab === "posts" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <h2 className="font-display font-bold text-lg text-sand-850 mb-4">Community Travel Posts</h2>
                    {relatedPosts.length > 0 ? (
                      relatedPosts.map((post) => (
                        <PostCard key={post._id} post={post} />
                      ))
                    ) : (
                      <p className="text-xs text-sand-450 italic py-6">No posts found containing tag or location {destination.name}.</p>
                    )}
                  </motion.div>
                )}

                {activeTab === "journeys" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <h2 className="font-display font-bold text-lg text-sand-850 mb-4">Related Road Trips & Journeys</h2>
                    {relatedJourneys.length > 0 ? (
                      relatedJourneys.map((j) => (
                        <Link
                          key={j._id}
                          to={`/journey/${j.slug}`}
                          className="block p-5 bg-white border border-sand-150 hover:border-ocean-300 rounded-3xl shadow-[0_8px_30px_rgb(20,41,57,0.01)] hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-display font-bold text-base text-sand-850 leading-snug mb-1">{j.title}</h3>
                              <p className="text-xs text-sand-450">Organized by {j.owner?.fullname}</p>
                            </div>
                            <HiArrowRight className="text-sand-400 text-lg hover:text-ocean-600 transition-colors" />
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-xs text-sand-450 italic py-6">No journeys contain steps within {destination.name} yet.</p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right Block - Sidebar info / coordinates & internal recommendations */}
            <div className="space-y-6">
              
              {/* Destination Metadata Card */}
              <div className="bg-white rounded-[2rem] border border-sand-100 shadow-[0_8px_30px_rgb(20,41,57,0.02)] p-6">
                <h3 className="font-display font-bold text-sm text-sand-850 uppercase tracking-wider mb-4 border-b border-sand-50 pb-2">
                  Map coordinates
                </h3>
                <div className="space-y-3.5 text-xs text-sand-600 font-sans">
                  <div className="flex justify-between">
                    <span className="text-sand-400">Latitude:</span>
                    <span className="font-semibold text-sand-800">{destination.location.latitude.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sand-400">Longitude:</span>
                    <span className="font-semibold text-sand-800">{destination.location.longitude.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sand-400">Region:</span>
                    <span className="font-semibold text-sand-800">{destination.district}</span>
                  </div>
                </div>
              </div>

              {/* Nearby Destinations recommendations */}
              <div className="bg-white rounded-[2rem] border border-sand-100 shadow-[0_8px_30px_rgb(20,41,57,0.02)] p-6">
                <h3 className="font-display font-bold text-sm text-sand-850 uppercase tracking-wider mb-4 border-b border-sand-50 pb-2">
                  Nearby Destinations
                </h3>
                <div className="space-y-3">
                  {nearbyDestinations.map((near) => (
                    <Link
                      key={near._id}
                      to={`/destinations/${near.slug}`}
                      className="block p-3.5 rounded-2xl hover:bg-sand-50 border border-transparent hover:border-sand-100 transition-all duration-300"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-sm text-sand-800 leading-snug">{near.name}</h4>
                          <span className="text-[10px] text-sand-400 font-medium">{near.district}</span>
                        </div>
                        <span className="text-[10px] text-ocean-600 bg-ocean-50 px-2 py-0.5 rounded-lg font-bold">
                          {near.distance.toFixed(1)} km
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DestinationDetail;
