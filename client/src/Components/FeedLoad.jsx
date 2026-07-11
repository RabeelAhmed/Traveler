import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import { getFeedData } from "../Toolkit/slices/feedSlice";
import PostCardSkeleton from "./PostCardSkeleton";

const FeedLoad = () => {
  const dispatch = useDispatch();
  const feedStatus = useSelector((state) => state.feed.status);
  const feed = useSelector((state) => state.feed.feed);

  useEffect(() => {
    if (feedStatus === "idle") {
      dispatch(getFeedData());
    }
  }, [dispatch, feedStatus]);

  if (feedStatus === "loading") {
    return (
      <div className="max-w-xl mx-auto py-6">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <Outlet />
    </div>
  );
};

export default FeedLoad;
