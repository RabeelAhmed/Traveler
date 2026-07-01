import "./App.css";
import React from "react";
import Login from "./Pages/Authentication/Login";
import ResetPassword from "./Pages/Authentication/ResetPassword";
import Signup from "./Pages/Authentication/Signup";
import Landing from "./Pages/Landing";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import OnlyIfUserNotLoggedIn from "./Components/OnlyIfUserNotLoggedIn";

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
      </Routes>
    </>
  );
}
export default App;
