import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import ProfileImage from "./ProfileImage";
import { followAndUnfollowUser } from "../Toolkit/slices/userProfileSlice";
import { springPress } from "../utils/motion";

const ProfileCard = ({ user }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isFollowing, setIsFollowing] = useState(false);
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const liveUsers = useSelector((state) => state.live.liveUsers) || {};
  const [owner, setOwner] = useState(false);

  useEffect(() => {
    if (!user?._id || !myProfile?._id) return;
    setOwner(user._id === myProfile._id);
    const isUserFollowed = myProfile?.following?.some((followedUser) =>
      typeof followedUser === "string"
        ? followedUser === user._id
        : followedUser._id === user._id
    );

    setIsFollowing(isUserFollowed);
  }, [user, myProfile]);

  const handleProfileClick = () => {
    navigate(`/profile/${user._id}`);
  };

  const handleFollow = (e) => {
    e.stopPropagation();
    dispatch(followAndUnfollowUser({ followId: user._id }));
    setIsFollowing((prev) => !prev);
  };

  return (
    <div
      className="bg-white rounded-3xl border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.01)] hover:shadow-[0_8px_30px_rgb(20,41,57,0.03)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer p-5 w-full mx-auto mt-2 text-left"
      onClick={handleProfileClick}
    >
      <div className="flex items-center justify-between">
        {/* User Info details */}
        <div className="flex items-center space-x-3.5">
          <div className="border border-ocean-100 rounded-full p-0.5">
            <ProfileImage
              userProfileImage={user?.profilePicture?.url}
              userId={user._id}
            />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-sand-900 leading-tight">
              {user?.fullname}
            </h3>
            <p className="font-sans text-xs font-semibold text-sand-400 mt-0.5">
              @{user?.username}
            </p>
            {liveUsers[user?._id] && (
              <div className="flex items-center gap-1 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sunset-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sunset-500"></span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-sunset-500 bg-sunset-50 border border-sunset-100 rounded-full px-1.5 py-0.5">
                  Live
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {!owner && (
          <motion.button
            {...springPress}
            onClick={handleFollow}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all duration-200 ${
              isFollowing
                ? "bg-sand-400 hover:bg-sand-500"
                : "bg-ocean-600 hover:bg-ocean-700"
            }`}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </motion.button>
        )}
      </div>

      {/* Bio excerpt */}
      {user?.bio && (
        <p className="mt-3.5 font-sans text-xs md:text-sm text-sand-600 line-clamp-2 leading-relaxed">
          {user.bio}
        </p>
      )}
    </div>
  );
};

export default ProfileCard;
