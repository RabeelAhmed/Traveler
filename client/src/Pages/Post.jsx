import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { fetchPostById } from "../Toolkit/slices/feedSlice";
import { getMyInfo } from "../Toolkit/slices/appConfigSlice";
import { KEY_ACCESS_TOKEN, getItem } from "../utils/LocalStorageManager";
import PostComp from "../Components/Post";
import CommentCard from "../Components/CommentCard";
import AddComment from "../Components/AddComment";
import { PageNotFound } from "./PageNotFound";
import Loader from "../Components/Loader";
import PageTransition from "../Components/PageTransition";
import SEO from "../Components/SEO";
import { fadeUp, staggerContainer } from "../utils/motion";
import ReviewCard from "../Components/ReviewCard";
import { getReviewsForLocation } from "../Toolkit/slices/reviewSlice";

const Post = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const commentSectionRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const token = getItem(KEY_ACCESS_TOKEN);
  const isLoggedIn = useSelector((state) => state.appConfig.isLoggedIn);
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const appStatus = useSelector((state) => state.appConfig.status);

  const feed = useSelector((state) => state.feed.feed);
  const feedStatus = useSelector((state) => state.feed.status);

  const post = feed.find((post) => post.id === id);

  const [showMobileComments, setShowMobileComments] = useState(false);

  // Load user info if token exists and profile is not loaded
  useEffect(() => {
    if (token && appStatus === "idle") {
      dispatch(getMyInfo());
    }
  }, [token, appStatus, dispatch]);

  // Load post if not in Redux store
  useEffect(() => {
    if (!post && feedStatus !== "loading") {
      dispatch(fetchPostById(id));
    }
  }, [id, dispatch, post, feedStatus]);

  // Load reviews for the post location
  const postLocation = post?.location;
  const { reviews: locationReviews } = useSelector((state) => state.review);
  useEffect(() => {
    if (postLocation) {
      dispatch(getReviewsForLocation(postLocation));
    }
  }, [postLocation, dispatch]);

  // Scroll to comments (for desktop scroll action)
  const scrollToComment = () => {
    if (commentSectionRef.current) {
      commentSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle loading states
  if (feedStatus === "loading" || (token && appStatus === "loading")) {
    return <Loader />;
  }

  // If post fetch failed
  if (feedStatus === "failed") {
    return <PageNotFound />;
  }

  // If post still not found
  if (!post) {
    return null;
  }

  const handleLoginRedirect = () => {
    navigate("/login", { state: { from: location }, replace: true });
  };

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    "headline": post?.title,
    "image": post?.media?.map((m) => m.url) || [],
    "datePublished": post?.postingDate,
    "description": post?.description?.substring(0, 150),
    "author": {
      "@type": "Person",
      "name": post?.owner?.name || "Traveler User"
    }
  };

  return (
    <PageTransition>
      <SEO
        title={`${post?.title} | Traveler`}
        description={post?.description ? post.description.substring(0, 150) : "View this travel story shared on Traveler."}
        path={`/post/${id}`}
        image={post?.media?.[0]?.url}
        type="article"
      >
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSchema)}
        </script>
      </SEO>
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        
        {/* Post detail wrapper */}
        <div className="max-w-4xl mx-auto px-0 sm:px-6 md:px-8">
          
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="w-full bg-white md:rounded-3xl shadow-[0_8px_30px_rgb(20,41,57,0.02)] border-0 md:border border-sand-100/80 overflow-hidden"
          >
            <PostComp
              post={post}
              scrollToComment={scrollToComment}
              openMobileComments={() => setShowMobileComments(true)}
            />
          </motion.div>

          {/* Desktop Comments Section */}
          <div className="hidden md:block mt-8 border border-sand-100/80 bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(20,41,57,0.02)]">
            <p className="font-display font-semibold text-2xl text-sand-900 mb-6" ref={commentSectionRef}>
              Comments
            </p>

            {isLoggedIn ? (
              <AddComment postId={id} />
            ) : (
              <div className="p-4 border border-sand-200 rounded-xl bg-yellow-50/50 text-yellow-800 text-sm font-semibold mb-6">
                <p>
                  <button
                    onClick={handleLoginRedirect}
                    className="text-ocean-600 underline hover:text-ocean-700"
                  >
                    Login
                  </button>{" "}
                  to like or add a comment.
                </p>
              </div>
            )}

            <div className="divide-y divide-sand-50">
              {post.comments?.map((comment, index) => (
                <CommentCard key={index} comment={comment} />
              ))}
            </div>
          </div>

          {/* Reviews Preview Section */}
          {post.location && (
            <div className="mt-8 border border-sand-100/80 bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(20,41,57,0.02)]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-xl text-sand-900">
                  Reviews for <span className="text-ocean-600">{post.location}</span>
                </h2>
                <a
                  href={`/reviews?location=${encodeURIComponent(post.location)}`}
                  className="text-xs font-semibold text-ocean-600 hover:text-ocean-700 transition-colors whitespace-nowrap"
                >
                  See all →
                </a>
              </div>

              {locationReviews.length === 0 ? (
                <a
                  href={`/reviews?location=${encodeURIComponent(post.location)}`}
                  className="block bg-jade-50 border border-jade-200 rounded-2xl p-5 text-center text-jade-600 font-semibold text-sm hover:bg-jade-100 transition-colors"
                >
                  ✨ Be the first to review this place →
                </a>
              ) : (
                <motion.div
                  variants={staggerContainer()}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {locationReviews.slice(0, 2).map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                  {locationReviews.length > 2 && (
                    <a
                      href={`/reviews?location=${encodeURIComponent(post.location)}`}
                      className="block text-center text-sm font-semibold text-ocean-600 hover:text-ocean-700 py-2 transition-colors"
                    >
                      See all {locationReviews.length} reviews →
                    </a>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Bottom Comments Sheet */}
        <AnimatePresence>
          {showMobileComments && (
            <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ocean-950/20 backdrop-blur-sm"
                onClick={() => setShowMobileComments(false)}
              />
              {/* Sheet container */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative bg-white rounded-t-3xl shadow-xl w-full max-h-[80vh] overflow-y-auto px-5 pb-8 pt-4 z-10 flex flex-col"
              >
                {/* Pull Handle */}
                <div className="flex justify-center mb-4 cursor-pointer" onClick={() => setShowMobileComments(false)}>
                  <div className="w-12 h-1 bg-sand-200 rounded-full" />
                </div>

                <div className="flex justify-between items-center mb-4">
                  <p className="font-display font-semibold text-lg text-sand-900">
                    Comments ({post.comments?.length || 0})
                  </p>
                  <button
                    onClick={() => setShowMobileComments(false)}
                    className="text-xs font-bold text-sand-400 hover:text-sand-600 uppercase tracking-wider"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  {isLoggedIn ? (
                    <AddComment postId={id} />
                  ) : (
                    <div className="p-4 border border-sand-200 rounded-xl bg-yellow-50/50 text-yellow-800 text-xs font-semibold mb-4">
                      <p>
                        <button
                          onClick={handleLoginRedirect}
                          className="text-ocean-600 underline font-bold"
                        >
                          Login
                        </button>{" "}
                        to add a comment.
                      </p>
                    </div>
                  )}

                  <div className="divide-y divide-sand-50">
                    {post.comments?.length > 0 ? (
                      post.comments.map((comment, index) => (
                        <CommentCard key={index} comment={comment} />
                      ))
                    ) : (
                      <p className="text-center text-xs text-sand-400 py-12">
                        No comments yet. Write one below!
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Post;
