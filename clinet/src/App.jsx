import "./App.css";
import React, { useState, useEffect } from "react"; // Use 'React' (capitalized) in imports
import { useDispatch, useSelector } from "react-redux";
import Login from "./Pages/Authentication/Login";
import ResetPassword from "./Pages/Authentication/ResetPassword";
import Signup from "./Pages/Authentication/Signup"; // Ensure this is correct
import Home from "./Pages/Home";
import Landing from "./Pages/Landing";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageNotFound } from "./Pages/PageNotFound";
import Navbar from "./Components/Navbar";
import Story from "./Pages/Story";
import UnderConstruction from "./Pages/UnderConstruction";
import Forum from "./Pages/Forum";
import Post from "./Pages/Post";
import Profile from "./Pages/Profile";
import { getMyInfo } from "./Toolkit/slices/appConfigSlice";
import OnlyIfUserNotLoggedIn from "./Components/OnlyIfUserNotLoggedIn";
import RequireUser from "./Components/RequireUser";
import CreatePost from "./Pages/CreatePost";
import ProfileUpdate from "./Pages/ProfileUpdate";
import FeedLoad from "./Components/FeedLoad";
import UploadStory from "./Components/UploadStory";
import Notifications from "./Components/Notification";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { axiosClient } from "./utils/axiosClient";
import TravelAdvisor from "./Pages/TravelAdvisor";
import Search from "./Pages/Search";
import Loader from "./Components/Loader";
import JourneyTreeView from "./Pages/JourneyTreeView";
import TrendingDestinations from "./Pages/TrendingDestinations";

import { KEY_ACCESS_TOKEN, getItem } from './utils/LocalStorageManager'
import { setLoggedIn} from './Toolkit/slices/appConfigSlice';
import { prependPost } from './Toolkit/slices/feedSlice';

const REACT_APP_SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;
function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const token = getItem(KEY_ACCESS_TOKEN);
  const status = useSelector((state) => state.appConfig.status);

  useEffect(() => {
    if (token && status === "idle") {
      dispatch(getMyInfo());
      dispatch(setLoggedIn(true));
    }
  }, [dispatch, token, status]);
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const userId = myProfile?._id;
  const [notifications, setNotifications] = useState([]);
  const notificationMessages = {
    like: "liked your post! ❤️",
    comment: "commented on your post! 💬",
    follow: "followed you! 🔥",
    Achivement: "You Got An Achievement!",
    journey_start: "started a new journey! 🚀",
    journey_step: "added a new step to their journey 🗺️",
    journey_complete: "completed their journey! 🏁",
  };
  // Fetch Notifications
  useEffect(() => {
    if (!userId) return; // ✅ Prevent API call if user is not logged in

    const getNotifications = async () => {
      try {
        const { data } = await axiosClient.get("/user/getnotification");
        const sortedNotifications = data.notifications.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sortedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    getNotifications();
  }, [userId]);

  const toasting = (message) => {
    toast.success(message);
  };
  useEffect(() => {
    if (!userId) return;

    const newsocket = io(REACT_APP_SERVER_BASE_URL, { autoConnect: true });

    newsocket.emit("join", userId);

    const handleNewNotification = (notification) => {
      const message = `${notification?.sender?.username} ${
        notificationMessages[notification?.type] || "performed an action!"
      }`;
      toasting(message);
      setNotifications((prev) => {
        const isDuplicate = prev.some((n) => n._id === notification._id);
        if (isDuplicate) return prev;
        return [notification, ...prev].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      });
    };

    // Real-time feed: prepend new posts from followed users instantly
    const handleNewPost = (post) => {
      dispatch(prependPost(post));
      toast(`✨ New post in your feed!`, {
        icon: '🗺️',
        style: { fontWeight: 600, fontSize: '13px' },
      });
    };

    newsocket.on("newNotification", handleNewNotification);
    newsocket.on("newPost", handleNewPost);

    return () => {
      newsocket.disconnect();
    };
  }, [userId]);

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/underconstruction" element={<UnderConstruction />} />
          <Route path="/*" element={<PageNotFound />} />
          <Route path="/post/:id" element={<Post />} />
          {/* Only show login/signup routes if the user is not logged in */}
          <Route element={<OnlyIfUserNotLoggedIn />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup" element={<Signup />} /> {/* Corrected */}
          </Route>
          {/* Other routes that require authentication */}
          <Route element={<RequireUser />}>
            <Route path="/home" element={<Home />} />
            <Route path="/createpost" element={<CreatePost />} />
            <Route path="/traveladvisor" element={<TravelAdvisor />} />
            <Route path="/updateprofile" element={<ProfileUpdate />} />
            <Route path="/story" element={<Story />} />
            <Route path="/addstory" element={<UploadStory />} />
            <Route path="/search" element={<Search />} />
            <Route path="/journey/:id" element={<JourneyTreeView />} />
            <Route path="/trending" element={<TrendingDestinations />} />
            <Route path="/" element={<FeedLoad />}>
              <Route path="/forum" element={<Forum />} />
              
            </Route>
            <Route path="/profile/:id" element={<Profile />} />

            <Route path="/loader" element={<Loader />} />
            <Route
              path="/notification"
              element={<Notifications notifications={notifications} />}
            />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
