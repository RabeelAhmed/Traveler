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
    Achievement: "earned an achievement milestone!",
    Achivement: "earned an achievement milestone!",
    journey_start: "started a new journey! 🚀",
    journey_step: "added a new step to their journey 🗺️",
    journey_complete: "completed their journey! 🏁",
  };

  const badgeColors = {
    follow: "bg-ocean-500 text-white",
    like: "bg-sunset-500 text-white",
    comment: "bg-sand-600 text-white",
    Achievement: "bg-jade-500 text-white",
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
      case "Achievement":
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
        <h4 className="font-display font-black text-[10px] text-sand-400 uppercase tracking-widest pl-2">
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

            // Determine left accent border based on notification type
            const accentColors = {
              follow: "border-l-ocean-500",
              like: "border-l-sunset-500",
              comment: "border-l-sand-500",
              Achivement: "border-l-jade-500",
              journey_start: "border-l-amber-500",
              journey_step: "border-l-ocean-400",
              journey_complete: "border-l-jade-500",
            };
            const leftBorderColor = accentColors[notif.type] || "border-l-sand-300";

            return (
              <motion.div
                key={notif._id || idx}
                variants={fadeUp}
                whileHover={{ y: -2, scale: 1.01 }}
                onClick={() => target && navigate(target)}
                className={`group flex items-center gap-4 p-4 rounded-3xl border-y border-r border-l-[4px] ${leftBorderColor} transition-all duration-300 ${
                  isUnread
                    ? "bg-ocean-50/30 border-ocean-100/50 shadow-[0_8px_30px_rgba(65,120,159,0.06)]"
                    : "bg-white border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.01)]"
                } ${target ? "cursor-pointer hover:border-ocean-100 hover:shadow-[0_12px_40px_rgba(65,120,159,0.08)]" : "cursor-default"}`}
              >
                {/* Profile Image with corner indicator badge */}
                <div className="relative flex-shrink-0">
                  <div className="border border-sand-100 rounded-full p-0.5 bg-white shadow-sm">
                    <ProfileImage
                      userProfileImage={notif?.sender?.profilePicture?.url}
                      userId={notif?.sender?._id}
                    />
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-transform duration-300 ${
                      badgeColors[notif.type] || "bg-sand-400 text-white"
                    }`}
                  >
                    <BadgeIcon type={notif.type} />
                  </motion.div>
                </div>

                {/* Text details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sand-800 text-xs md:text-sm leading-relaxed font-sans">
                    <span className={`font-bold text-sand-900 group-hover:text-ocean-600 transition-colors ${isUnread ? "font-extrabold" : ""}`}>
                      {notif?.sender?.username || "System"}
                    </span>{" "}
                    <span className={`${isUnread ? "text-sand-800 font-semibold" : "text-sand-600"}`}>
                      {notificationMessages[notif.type] || "performed an action!"}
                    </span>
                  </p>
                  <p className="text-[10px] font-bold text-sand-400 mt-1 uppercase tracking-wider flex items-center gap-1.5">
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(notif.createdAt))} ago</span>
                  </p>
                </div>

                {/* Pulsing jade dot for unread entries */}
                {isUnread && (
                  <div className="relative flex h-2.5 w-2.5 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jade-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-jade-500 shadow-sm shadow-jade-300"></span>
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
            /* Premium Empty Notification Panel */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-white rounded-3xl border border-sand-150 shadow-[0_8px_30px_rgb(20,41,57,0.02)] flex flex-col items-center justify-center py-20 px-8 text-center max-w-md mx-auto"
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-ocean-50/40 blur-2xl -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-sand-100/50 blur-xl translate-y-1/2" />
              
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-ocean-50 to-sand-100/80 border border-ocean-100 flex items-center justify-center shadow-lg relative">
                  <FaBellSlash className="text-sand-400 text-3xl animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-orange-400 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-sand-800">
                    All caught up!
                  </h3>
                  <p className="font-sans text-xs text-sand-400 mt-2 max-w-xs leading-relaxed">
                    No new notifications available right now. Check back later when people interact with your journey posts!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Notifications;
