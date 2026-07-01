import "./App.css";
import React from "react";
import Login from "./Pages/Authentication/Login";
import ResetPassword from "./Pages/Authentication/ResetPassword";
import Signup from "./Pages/Authentication/Signup";
import Home from "./Pages/Home";
import Landing from "./Pages/Landing";
import Forum from "./Pages/Forum";
import Story from "./Pages/Story";
import UploadStory from "./Components/UploadStory";
import FeedLoad from "./Components/FeedLoad";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import OnlyIfUserNotLoggedIn from "./Components/OnlyIfUserNotLoggedIn";
import RequireUser from "./Components/RequireUser";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route element={<OnlyIfUserNotLoggedIn />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route element={<RequireUser />}>
          <Route path="/home" element={<Home />} />
          <Route path="/story" element={<Story />} />
          <Route path="/addstory" element={<UploadStory />} />
          <Route path="/" element={<FeedLoad />}>
            <Route path="/forum" element={<Forum />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
export default App;
