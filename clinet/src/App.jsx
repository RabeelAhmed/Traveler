import "./App.css";
import React from "react";
import Landing from "./Pages/Landing";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
    </>
  );
}
export default App;
