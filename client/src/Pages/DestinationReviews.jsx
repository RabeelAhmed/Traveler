import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import StarRating from "../Components/StarRating";
import { FiMapPin, FiEdit3 } from "react-icons/fi";
import {
  getReviewsForLocation,
  getMyReview,
  createOrUpdateReview,
} from "../Toolkit/slices/reviewSlice";
import ReviewCard from "../Components/ReviewCard";
import Header from "../Components/Header";
import PageTransition from "../Components/PageTransition";
import SEO from "../Components/SEO";
import { staggerContainer, fadeUp, springPress } from "../utils/motion";

const DestinationReviews = () => {
  const [params] = useSearchParams();
  const location = params.get("location") || "";
  const dispatch = useDispatch();

  const { reviews, summary, myReview, status } = useSelector((state) => state.review);

  // Form state
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visitedAt, setVisitedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch on mount / location change
  useEffect(() => {
    if (location) {
      dispatch(getReviewsForLocation(location));
      dispatch(getMyReview(location));
    }
  }, [location, dispatch]);

  // Pre-fill form from myReview (edit mode)
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating || 0);
      setTitle(myReview.title || "");
      setBody(myReview.body || "");
      if (myReview.visitedAt) {
        // Convert to YYYY-MM for <input type="month">
        const d = new Date(myReview.visitedAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        setVisitedAt(`${yyyy}-${mm}`);
      }
    } else {
      setRating(0);
      setTitle("");
      setBody("");
      setVisitedAt("");
    }
  }, [myReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !title.trim() || !body.trim() || !visitedAt) return;

    setSubmitting(true);
    // Convert YYYY-MM to a full ISO date (first day of month)
    const visitedDate = new Date(`${visitedAt}-01`).toISOString();
    await dispatch(
      createOrUpdateReview({ location, rating, title: title.trim(), body: body.trim(), visitedAt: visitedDate })
    );
    setSubmitting(false);
    // Refresh reviews list
    dispatch(getReviewsForLocation(location));
  };

  // Rating bar chart helpers
  const maxBreakdown = summary
    ? Math.max(...Object.values(summary.ratingBreakdown), 1)
    : 1;

  const hasReviews = reviews && reviews.length > 0;
  const ratingValue = summary?.avgRating || 0;
  const reviewCount = summary?.totalReviews || reviews?.length || 0;

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": location || "Destination",
    "description": `Traveler reviews and travel guide for ${location || "Pakistan destinations"}.`,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PK"
    },
    ...(reviewCount > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": ratingValue.toFixed(1),
        "reviewCount": reviewCount,
        "bestRating": "5",
        "worstRating": "1"
      }
    } : {}),
    ...(hasReviews ? {
      "review": reviews.slice(0, 5).map((rev) => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": rev.rating,
          "bestRating": "5",
          "worstRating": "1"
        },
        "name": rev.title,
        "author": {
          "@type": "Person",
          "name": rev.author?.fullname || rev.author?.username || "Traveler User"
        },
        "datePublished": rev.createdAt || rev.visitedAt,
        "reviewBody": rev.body
      }))
    } : {})
  };

  return (
    <PageTransition>
      <SEO
        title={location ? `${location} Reviews & Travel Guide | Traveler` : "Destination Reviews | Traveler"}
        description={location ? `Read reviews, ratings, and local travel guide details for ${location}, Pakistan. Share your own experience and tips with the traveler community.` : "Browse destination reviews and travel guides shared by the traveler community in Pakistan."}
        path={`/reviews?location=${encodeURIComponent(location)}`}
      >
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSchema)}
        </script>
      </SEO>
      <div className="bg-sand-50 min-h-screen pb-28 pt-20">
        <Header title={location || "Destination Reviews"} />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 mt-6">

          {/* ── Rating Summary Card ─────────────────────────────────────── */}
          {summary && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(20,41,57,0.06)] border border-sand-100/60 p-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Big avg number */}
                <div className="text-center flex-shrink-0">
                  <p className="font-display text-5xl font-bold text-ocean-600 leading-none">
                    {summary.avgRating.toFixed(1)}
                  </p>
                  <StarRating
                    count={5}
                    value={summary.avgRating}
                    edit={false}
                    size={22}
                    activeColor="#41789f"
                  />
                  <p className="text-xs text-sand-400 mt-1">
                    Based on {summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Rating breakdown bars */}
                <div className="flex-1 w-full space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = summary.ratingBreakdown[star] || 0;
                    const pct = Math.round((count / maxBreakdown) * 100);
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="text-sand-500 w-5 text-right font-medium">{star}</span>
                        <span className="text-sand-300 text-[10px]">★</span>
                        <div className="flex-1 h-2 rounded-full bg-sand-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-ocean-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sand-400 w-5">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Write / Edit Review Form ─────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-ocean-50 rounded-3xl border border-ocean-100 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <FiEdit3 className="text-ocean-500" />
              <h2 className="font-display font-semibold text-sand-900 text-lg">
                {myReview ? "Update Your Review" : "Write a Review"}
              </h2>
            </div>

            {/* Location label */}
            <div className="flex items-center gap-1.5 text-sm text-sand-500 mb-4">
              <FiMapPin className="text-ocean-400 flex-shrink-0" />
              <span className="font-medium truncate">{location}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star rating */}
              <div>
                <label className="block text-xs font-semibold text-sand-600 uppercase tracking-wider mb-1">
                  Your Rating
                </label>
                <StarRating
                  count={5}
                  value={rating}
                  edit={true}
                  onChange={(val) => setRating(val)}
                  size={32}
                  activeColor="#41789f"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-sand-600 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  placeholder="Summarise your experience"
                  required
                  className="w-full rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm text-sand-900 placeholder-sand-300 focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent transition"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-sand-600 uppercase tracking-wider mb-1">
                  Review
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Share the details of your visit..."
                  required
                  className="w-full rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm text-sand-900 placeholder-sand-300 focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent transition resize-none"
                />
                <p className="text-right text-[11px] text-sand-300 mt-0.5">{body.length}/1000</p>
              </div>

              {/* Visited At */}
              <div>
                <label className="block text-xs font-semibold text-sand-600 uppercase tracking-wider mb-1">
                  When did you visit?
                </label>
                <input
                  type="month"
                  value={visitedAt}
                  onChange={(e) => setVisitedAt(e.target.value)}
                  required
                  max={new Date().toISOString().slice(0, 7)}
                  className="w-full rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm text-sand-900 focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent transition"
                />
              </div>

              {/* Submit */}
              <motion.button
                {...springPress}
                type="submit"
                disabled={submitting || !rating}
                className="w-full py-3 rounded-2xl bg-ocean-600 text-white font-semibold text-sm shadow-md hover:bg-ocean-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Saving…" : myReview ? "Update Review" : "Submit Review"}
              </motion.button>
            </form>
          </motion.div>

          {/* ── Reviews List ─────────────────────────────────────────────── */}
          <div>
            <h2 className="font-display font-semibold text-sand-900 text-lg mb-4">
              {reviews.length > 0
                ? `${reviews.length} Review${reviews.length !== 1 ? "s" : ""}`
                : "No Reviews Yet"}
            </h2>

            {status === "loading" && (
              <div className="text-center py-10 text-sand-400 text-sm">Loading reviews…</div>
            )}

            {status !== "loading" && reviews.length === 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="bg-jade-50 border border-jade-200 rounded-3xl p-8 text-center"
              >
                <p className="text-jade-600 font-semibold">
                  Be the first to review this destination! ✨
                </p>
              </motion.div>
            )}

            <motion.div
              variants={staggerContainer()}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DestinationReviews;
