const user = require("../Models/User");
const { success, error } = require("../Utils/responseWrapper");
const { signjwt } = require("../Middleware/jwtAuthMiddleware");
const mongoose = require("mongoose");
const { mapPostOutput } = require("../Utils/utils");
const { cloudinary, uploadToCloudinary, validateFile } = require("../Utils/cloudinaryConfig");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const getResetPasswordEmail = require("../Utils/emailTemplates/resetPassword");
const { remember, deleteCache, TTL } = require("../Utils/cache");

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

const uploadProfilePicController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(error(400, "No profile picture file provided."));
    }

    // Backend validation (only image allowed, max 10MB)
    const fileType = validateFile(req.file);
    if (fileType !== "image") {
      return res.status(400).json(error(400, "Videos are not allowed for profile pictures."));
    }

    // Check if cloud configuration is dummy or missing (local development bypass/fallback)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
    if (cloudName === "dummy" || !cloudName) {
      const mimeType = req.file.mimetype || "image/jpeg";
      const base64Data = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
      return res.status(200).json({
        secure_url: base64Data,
        public_id: "dummy_profile_pic_" + Date.now(),
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, "traveler/profile", req.file.mimetype);
    return res.status(200).json({
      secure_url: result.url,
      public_id: result.publicId,
    });
  } catch (err) {
    console.error("uploadProfilePicController error:", err);
    return res.status(400).json(error(400, err.message));
  }
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
    return res.send(error(400, err.message));
  }
};

const getProfile = async (req, res) => {
  try {
    const user_Id = req.user.user_Id;
    const cacheKey = `profile:${user_Id}`;

    const cached = await remember(cacheKey, TTL.PROFILE, async () => {
      const userProfile = await user.findById(user_Id);
      if (!userProfile) return null;

      const allPosts = await userProfile.populate({
        path: "posts",
        populate: [
          { path: "userId" },
          { path: "comments", populate: { path: "userId", select: "fullname profilePicture" } },
        ],
      });

      const posts = allPosts?.posts
        ?.map((item) => mapPostOutput(item, user_Id))
        .reverse();

      return { userProfile, posts };
    });

    if (!cached) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: { userProfile: cached.userProfile, posts: cached.posts },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_Id; // Extract user ID from request
    const { fullname, bio, email, dateOfBirth } = req.body;
    let updateFields = { fullname, bio, email, dateOfBirth };

    // Handle profile picture update
    if (req.file) {
      // Backend validation
      const fileType = validateFile(req.file);
      if (fileType !== "image") {
        return res.send(error(400, "Videos are not allowed for profile pictures."));
      }

      // Find the user to get current profile picture
      const existingUser = await user.findById(userId);
      if (existingUser && existingUser.profilePicture && existingUser.profilePicture.publicId) {
        // Delete old profile picture from Cloudinary
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
        if (cloudName && cloudName !== "dummy") {
          try {
            await cloudinary.uploader.destroy(existingUser.profilePicture.publicId, { resource_type: "image" });
            console.log(`Deleted old profile picture from Cloudinary: ${existingUser.profilePicture.publicId}`);
          } catch (err) {
            console.error(`Failed to delete old profile picture ${existingUser.profilePicture.publicId} from Cloudinary:`, err);
          }
        }
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
      if (cloudName === "dummy" || !cloudName) {
        const mimeType = req.file.mimetype || "image/jpeg";
        const base64Data = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
        updateFields.profilePicture = {
          publicId: "dummy_profile_pic_" + Date.now(),
          url: base64Data,
          resourceType: "image"
        };
      } else {
        // Upload new image to Cloudinary folder traveler/profile
        const result = await uploadToCloudinary(req.file.buffer, "traveler/profile", req.file.mimetype);
        updateFields.profilePicture = {
          publicId: result.publicId,
          url: result.url,
          resourceType: result.resourceType
        };
      }
    }

    // Update user profile
    const updatedUser = await user.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return res.send(error(404, "User not found"));
    }

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await deleteCache(`profile:${userId}`);

    return res.send(
      success(200, { message: "Profile updated successfully", updatedUser })
    );
  } catch (err) {
    console.error(err);
    return res.send(error(500, err.message));
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
      html: getResetPasswordEmail(resetUrl, userProfile.fullname),
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
  getProfile,
  updateProfile,
  generateProfilePicSignature,
  uploadProfilePicController,
  forgotPassword,
  resetPassword,
};
