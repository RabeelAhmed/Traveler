
const user = require("../Models/User");
const { success, error } = require("../Utils/responseWrapper");
const { signjwt } = require("../Middleware/jwtAuthMiddleware");
const mongoose = require("mongoose");
const { mapPostOutput } = require("../Utils/utils");
const cloudinary = require("../Utils/cloudinaryConfig");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const signup = async (req, res) => {
  try {
    const {
      username,
      fullname,
      email,
      password,
      dateOfBirth,
      bio,
      kofi,
      profilePictureUrl,
      profilePicturePublicId,
    } = req.body;
    console.log(req.body);
    // ✅ Basic field validation
    if (!username || !email || !password || !dateOfBirth || !fullname || !bio) {
      return res.send(error(400, "Please fill all the required fields"));
    }

    // ✅ Check for existing email or username
    const userMailExist = await user.findOne({ email });
    if (userMailExist) {
      return res.send(error(400, "Email already exists"));
    }

    const userNameExist = await user.findOne({ username });
    if (userNameExist) {
      return res.send(error(400, "Username already exists"));
    }

    // ✅ Prepare profile picture object
    const profilePicture = {
      public_id: profilePicturePublicId || null,
      url:
        profilePictureUrl ||
        "https://res.cloudinary.com/djiqzvcev/image/upload/v1729021294/blank-profile-picture-973460_1280_kwgltq.png",
    };

    // ✅ Create new user
    const newUser = new user({
      username,
      fullname,
      email,
      password,
      dateOfBirth,
      koFiUrl: kofi,
      bio,
      profilePicture,
    });

    await newUser.save();

    // ✅ Generate and return token
    const token = signjwt(newUser._id);
    return res.send(success(200, token));
  } catch (err) {
    console.error("Signup Error:", err);
    return res.send(error(500, err.message));
  }
};
const generateProfilePicSignature = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "Profile_Pictures",
    },
    process.env.CLOUDINARY_API_SECRET
  );
  console.log(
    signature,
    timestamp,
    process.env.CLOUD_NAME,
    "ApiKey",
    process.env.API_KEY
  );
  return res.status(201).json({
    signature,
    timestamp,
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.API_KEY,
  });
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (!email || !password) {
      return res.send(error(400, "Please fill all the fields"));
    }
    const userExisted = await user.findOne({ email }).select("+password");
    console.log(userExisted);
    if (!userExisted) {
      return res.send(error(403, "User does'nt Existed"));
    }
    const isMatch = await userExisted.comparePassword(password);
    if (!isMatch) {
      return res.send(error(403, "Incorrect Password"));
    }
    const token = signjwt(userExisted._id);
    return res.send(success(200, { token }));
  } catch (err) {
    return res.send(error(400, err));
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const userProfile = await user.findOne({ email });
    if (!userProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save token to user
    userProfile.resetPasswordToken = resetToken;
    userProfile.resetPasswordExpires = resetTokenExpiry;
    await userProfile.save();

    // Send email via Resend
    const resetUrl = `${process.env.ORIGIN}/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: "no-reply@resend.dev",
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset. Click the link below:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    res.status(200).json({ message: "Reset link sent to email!" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
};
// Reset password (using token)
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user by token & check expiry
    const userProfile = await user.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!userProfile) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    userProfile.password = newPassword;
    userProfile.resetPasswordToken = undefined;
    userProfile.resetPasswordExpires = undefined;
    await userProfile.save();

    res.status(200).json({ message: "Password reset successful!" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
};
module.exports = {
  signup,
  login,
  generateProfilePicSignature,
  forgotPassword,
  resetPassword,
};
