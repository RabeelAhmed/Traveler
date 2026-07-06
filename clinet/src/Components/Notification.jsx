import React from "react";
import { formatDistanceToNow, isToday, differenceInDays } from "date-fns";
import { FaHeart, FaComment, FaUserPlus, FaTrophy, FaBellSlash } from "react-icons/fa";
import { MdOutlineRoute, MdOutlineFlag, MdOutlineExplore } from "react-icons/md";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ProfileImage from "./ProfileImage";
import Header from "./Header";
import PageTransition from "./PageTransition";
import { fadeUp, staggerContainer } from "../utils/motion";

const Notifications = ({ notifications = [] }) => {
  const navigate = useNavigate();
  // Notification Messages Map
  const notificationMessages = {
    like: "liked your post! ❤️",
    comment: "commented on your post! 💬",
    follow: "followed you! 🔥",
    Achivement: "earned an achievement milestone!",
    journey_start: "started a new journey! 🚀",
    journey_step: "added a new step to their journey 🗺️",
    journey_complete: "completed their journey! 🏁",
  };

  const badgeColors = {
    follow: "bg-ocean-500 text-white",
    like: "bg-sunset-500 text-white",
    comment: "bg-sand-600 text-white",
    Achivement: "bg-jade-500 text-white",
    journey_start: "bg-sunset-500 text-white",
    journey_step: "bg-ocean-500 text-white",
    journey_complete: "bg-jade-500 text-white",
  };

  const BadgeIcon = ({ type }) => {
    switch (type) {
      case "follow":
        return <FaUserPlus className="text-[9px]" />;
      case "like":
        return <FaHeart className="text-[9px]" />;
      case "comment":
        return <FaComment className="text-[9px]" />;
      case "journey_start":
        return <MdOutlineExplore className="text-[9px]" />;
      case "journey_step":
        return <MdOutlineRoute className="text-[9px]" />;
      case "journey_complete":
        return <MdOutlineFlag className="text-[9px]" />;
      case "Achivement":
      default:
        return <FaTrophy className="text-[9px]" />;
    }
  };

  // Group notifications chronologically
  const groupNotifications = (list) => {
    const today = [];
    const thisWeek = [];
    const earlier = [];

    list.forEach((notif) => {
      if (!notif.createdAt) return;
      const date = new Date(notif.createdAt);
      if (isToday(date)) {
        today.push(notif);
      } else if (differenceInDays(new Date(), date) <= 7) {
        thisWeek.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return { today, thisWeek, earlier };
  };

  const groups = groupNotifications(notifications);
  const hasNotifications = notifications.length > 0;

  // Resolve click destination: journey types open the journey, post types open the post
  const getNotifTarget = (notif) => {
    const journeyTypes = ['journey_start', 'journey_step', 'journey_complete'];
    if (journeyTypes.includes(notif.type) && notif.journey) {
      return `/journey/${notif.journey._id || notif.journey}`;
    }
    if (notif.post) {
      return `/post/${notif.post._id || notif.post}`;
    }
    return null;
  };

  const renderNotificationGroup = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="font-display font-bold text-[10px] text-sand-400 uppercase tracking-widest pl-1">
          {title}
        </h4>
        <motion.div
          variants={staggerContainer(0.05, 0.03)}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {items.map((notif, idx) => {
            const isUnread = notif.isRead === false || notif.read === false;
            const target = getNotifTarget(notif);
            return (
              <motion.div
                key={notif._id || idx}
                variants={fadeUp}
                onClick={() => target && navigate(target)}
                className={`flex items-center gap-4 p-4 bg-white rounded-2xl border border-sand-100/80 hover:bg-sand-50/50 shadow-[0_8px_30px_rgb(20,41,57,0.01)] transition-colors duration-300 ${
                  target ? 'cursor-pointer hover:border-ocean-100' : 'cursor-default'
                }`}
              >
                {/* Profile Image with corner indicator badge */}
                <div className="relative flex-shrink-0">
                  <div className="border border-sand-100 rounded-full p-0.5">
                    <ProfileImage
                      userProfileImage={notif?.sender?.profilePicture?.url}
                      userId={notif?.sender?._id}
                    />
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                      badgeColors[notif.type] || "bg-sand-400 text-white"
                    }`}
                  >
                    <BadgeIcon type={notif.type} />
                  </div>
                </div>

                {/* Text details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sand-800 text-xs md:text-sm leading-relaxed">
                    <span className={`font-sans font-bold text-sand-900 ${isUnread ? "font-extrabold" : ""}`}>
                      {notif?.sender?.username || "System"}
                    </span>{" "}
                    <span className="font-sans text-sand-650">
                      {notificationMessages[notif.type] || "performed an action!"}
                    </span>
                  </p>
                  <p className="text-[10px] font-sans text-sand-400 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt))} ago
                  </p>
                </div>

                {/* Pulsing jade dot for unread entries */}
                {isUnread && (
                  <div className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jade-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-jade-500"></span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        
        {/* Settings Header */}
        <Header
          title="Notifications"
          subtitle="Stay updated with follower alerts, likes, comments, and milestones."
        />

        <div className="max-w-xl mx-auto px-4 sm:px-6 mt-6 text-left">
          {hasNotifications ? (
            <div className="space-y-6">
              {renderNotificationGroup("Today", groups.today)}
              {renderNotificationGroup("This Week", groups.thisWeek)}
              {renderNotificationGroup("Earlier", groups.earlier)}
            </div>
          ) : (
            /* bell-off empty notification panel */
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
              <FaBellSlash className="text-sand-300 text-6xl mb-4 animate-pulse" />
              <h3 className="font-display font-semibold text-lg text-sand-800 mb-1.5">
                All caught up!
              </h3>
              <p className="font-sans text-xs text-sand-400 leading-relaxed">
                No new notifications available right now. Check back later when people interact with your journey posts!
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Notifications;
