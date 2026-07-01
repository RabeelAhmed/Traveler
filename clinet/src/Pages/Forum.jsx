import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import Header from "../Components/Header";
import PostCard from "../Components/PostCard";
import PostCardSkeleton from "../Components/PostCardSkeleton";
import { LeftRail, RightDiscovery } from "../Components/Sidebar";
import PageTransition from "../Components/PageTransition";
import { staggerContainer, fadeUp } from "../utils/motion";

const Forum = () => {
  const dispatch = useDispatch();
  const [active, setActive] = useState("feed");
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const feedStatus = useSelector((state) => state.feed.status);
  const feed = useSelector((state) => state.feed.feed);

  const followerPosts = feed.filter((post) =>
    myProfile?.following?.includes(post?.owner?._id)
  );
  const myPosts = feed.filter((post) => post?.owner?._id === myProfile?._id);

  const getFilteredFeed = () => {
    switch (active) {
      case "followers":
        return followerPosts;
      case "myPosts":
        return myPosts;
      case "feed":
      default:
        return feed;
    }
  };

  const activeFeed = getFilteredFeed();

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-20">
        {/* Editorial Header */}
        <Header
          title="Traveler Forum"
          subtitle="Explore stories, follow adventurers, and join the global explorer feed."
        />

        {/* 3-Column Page Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 grid grid-cols-1 md:grid-cols-[80px_1fr] lg:grid-cols-[88px_1fr_280px] gap-6">
          
          {/* Left sticky rail */}
          <div className="hidden md:block sticky top-24 self-start z-20">
            <LeftRail active={active} setActive={setActive} />
          </div>

          {/* Center editorial feed */}
          <div className="min-h-screen">
            {feedStatus === "loading" ? (
              <div className="space-y-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            ) : (
              <motion.div
                variants={staggerContainer(0.08, 0.05)}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {Array.isArray(activeFeed) && activeFeed.length > 0 ? (
                  activeFeed.map((post) => (
                    <motion.div key={`${active}-${post.id}`} variants={fadeUp}>
                      <PostCard post={post} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    variants={fadeUp}
                    className="bg-white rounded-3xl p-8 border border-sand-100/85 text-center text-sand-500 font-sans shadow-[0_8px_30px_rgb(20,41,57,0.01)]"
                  >
                    No posts available in this section.
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right sticky discovery sidebar */}
          <div className="hidden lg:block sticky top-24 self-start z-20">
            <RightDiscovery />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Forum;
