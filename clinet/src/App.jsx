import "./App.css";
import React from "react";
import Login from "./Pages/Authentication/Login";
import ResetPassword from "./Pages/Authentication/ResetPassword";
import Signup from "./Pages/Authentication/Signup";
import Home from "./Pages/Home";
import Landing from "./Pages/Landing";
import Forum from "./Pages/Forum";
import Post from "./Pages/Post";
import Profile from "./Pages/Profile";
import CreatePost from "./Pages/CreatePost";
import ProfileUpdate from "./Pages/ProfileUpdate";
import FeedLoad from "./Components/FeedLoad";
import UploadStory from "./Components/UploadStory";
import Story from "./Pages/Story";
import TravelAdvisor from "./Pages/TravelAdvisor";
import Search from "./Pages/Search";
import JourneyTreeView from "./Pages/JourneyTreeView";
import Loader from "./Components/Loader";
import PageNotFound from "./Pages/PageNotFound";
import UnderConstruction from "./Pages/UnderConstruction";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import OnlyIfUserNotLoggedIn from "./Components/OnlyIfUserNotLoggedIn";
import RequireUser from "./Components/RequireUser";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/underconstruction" element={<UnderConstruction />} />
        <Route path="/*" element={<PageNotFound />} />
        <Route path="/post/:id" element={<Post />} />
        <Route element={<OnlyIfUserNotLoggedIn />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route element={<RequireUser />}>
          <Route path="/home" element={<Home />} />
          <Route path="/createpost" element={<CreatePost />} />
          <Route path="/traveladvisor" element={<TravelAdvisor />} />
          <Route path="/updateprofile" element={<ProfileUpdate />} />
          <Route path="/story" element={<Story />} />
          <Route path="/addstory" element={<UploadStory />} />
          <Route path="/search" element={<Search />} />
          <Route path="/journey/:id" element={<JourneyTreeView />} />
          <Route path="/" element={<FeedLoad />}>
            <Route path="/forum" element={<Forum />} />
          </Route>
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/loader" element={<Loader />} />
        </Route>
      </Routes>
    </>
  );
}
export default App;
