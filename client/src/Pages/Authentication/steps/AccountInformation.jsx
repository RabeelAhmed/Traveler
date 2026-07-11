import React, { useState } from "react";
import { HiUser, HiMail, HiLockClosed } from "react-icons/hi";

const AccountInformation = ({ accountInfo, setAccountInfo }) => {
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
  });

  const validateField = (id, value) => {
    let error = "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (id === "username") {
      if (!value.trim()) {
        error = "Username is required";
      } else if (emailPattern.test(value)) {
        error = "Username cannot be an email address";
      }
    }

    const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (id === "email" && !gmailPattern.test(value)) {
      error = "Please enter a valid Gmail address (e.g. user@gmail.com)";
    }

    if (id === "password" && value.length < 6) {
      error = "Password must be at least 6 characters";
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [id]: error,
    }));
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setAccountInfo((prevInfo) => ({
      ...prevInfo,
      [id]: value,
    }));

    validateField(id, value);
  };

  return (
    <div className="w-full">
      <h2 className="font-display font-semibold text-2xl text-sand-900 mb-6">
        Sign Up to Traveler
      </h2>

      {/* Username field */}
      <div className="mb-4">
        <label htmlFor="username" className="block text-sm text-sand-700 font-semibold mb-2">
          Username
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
            <HiUser className="text-xl" />
          </span>
          <input
            id="username"
            type="text"
            placeholder="Enter Username"
            value={accountInfo.username}
            onChange={handleInputChange}
            className={`pl-11 pr-4 py-3 bg-sand-50 border ${
              errors.username ? "border-red-400 focus:ring-red-200" : "border-sand-200 focus:ring-ocean-300 focus:border-ocean-400"
            } rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:bg-white`}
          />
        </div>
        {errors.username && (
          <p className="text-red-500 text-xs mt-1.5 font-semibold pl-1">{errors.username}</p>
        )}
      </div>

      {/* Email field */}
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm text-sand-700 font-semibold mb-2">
          Email
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
            <HiMail className="text-xl" />
          </span>
          <input
            id="email"
            type="email"
            placeholder="Enter Email"
            value={accountInfo.email}
            onChange={handleInputChange}
            className={`pl-11 pr-4 py-3 bg-sand-50 border ${
              errors.email ? "border-red-400 focus:ring-red-200" : "border-sand-200 focus:ring-ocean-300 focus:border-ocean-400"
            } rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:bg-white`}
          />
        </div>
        {errors.email && (
          <p className="text-red-500 text-xs mt-1.5 font-semibold pl-1">{errors.email}</p>
        )}
      </div>

      {/* Password field */}
      <div className="mb-6">
        <label htmlFor="password" className="block text-sm text-sand-700 font-semibold mb-2">
          Password
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
            <HiLockClosed className="text-xl" />
          </span>
          <input
            id="password"
            type="password"
            placeholder="Enter Password"
            value={accountInfo.password}
            onChange={handleInputChange}
            className={`pl-11 pr-4 py-3 bg-sand-50 border ${
              errors.password ? "border-red-400 focus:ring-red-200" : "border-sand-200 focus:ring-ocean-300 focus:border-ocean-400"
            } rounded-xl w-full text-sand-800 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2 focus:bg-white`}
          />
        </div>
        {errors.password && (
          <p className="text-red-500 text-xs mt-1.5 font-semibold pl-1">{errors.password}</p>
        )}
      </div>
    </div>
  );
};

export default AccountInformation;
