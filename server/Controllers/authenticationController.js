const { signMedia, verifyMedia } = require("../Utils/mediaReceipt");
const user = require("../Models/User");
const { success, error } = require("../Utils/responseWrapper");
const { signjwt } = require("../Middleware/jwtAuthMiddleware");
const mongoose = require("mongoose");
const { mapPostOutput } = require("../Utils/utils");
const { cloudinary, uploadToCloudinary, validateFile } = require("../Utils/cloudinaryConfig");
const crypto = require("crypto");
const { hashResetToken, validPassword } = require("../Utils/security");
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
      profilePictureReceipt,
    } = req.body;
    if (![username, fullname, email, password, dateOfBirth, bio].every(value => typeof value === "string")) return res.status(400).json(error(400, "Invalid account fields"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || username.length > 40 || fullname.length > 100 || bio.length > 300 || !Number.isFinite(Date.parse(dateOfBirth)) || Date.parse(dateOfBirth) > Date.now()) return res.status(400).json(error(400, "Invalid account information"));
    // Basic field validation
    if (!username || !email || !password || !dateOfBirth || !fullname || !bio) {
      return res.status(400).send(error(400, "Please fill all the required fields"));
    }

    if (!validPassword(password)) return res.status(400).json(error(400, "Password must contain at least 8 characters and at most 72 bytes"));
    // Check for existing email or username
    const userMailExist = await user.findOne({ email });
    if (userMailExist) {
      return res.status(400).send(error(400, "Email already exists"));
    }

    const userNameExist = await user.findOne({ username });
    if (userNameExist) {
      return res.status(400).send(error(400, "Username already exists"));
    }

    if (profilePicturePublicId && !verifyMedia({ url: profilePictureUrl, publicId: profilePicturePublicId, resourceType: "image", receipt: profilePictureReceipt }, "signup", "profile")) return res.status(400).json(error(400, "Invalid profile upload"));
    // Prepare profile picture object
    const profilePicture = {
      publicId: profilePicturePublicId || null,
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
    return res.status(500).send(error(500, err.message));
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

  return res.status(201).json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY || process.env.API_KEY,
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
      const result = { url: base64Data, publicId: "dummy_profile_pic_" + Date.now(), resourceType: "image" };
      return res.status(200).json({ secure_url: result.url, public_id: result.publicId, receipt: signMedia(result, "signup", "profile") });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, "traveler/profile", req.file.mimetype);
    return res.status(200).json({
      secure_url: result.url,
      public_id: result.publicId,
      receipt: signMedia(result, "signup", "profile"),
    });
  } catch (err) {
    console.error("uploadProfilePicController error:", err);
    return res.status(400).json(error(400, err.message));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") return res.status(400).json(error(400, "Email and password are required"));
    if (!email || !password) {
      return res.status(400).send(error(400, "Please fill all the fields"));
    }
    const userExisted = await user.findOne({ email }).select("+password +tokenVersion");
    if (!userExisted) {
      return res.status(403).send(error(403, "User does'nt Existed"));
    }
    const isMatch = await userExisted.comparePassword(password);
    if (!isMatch) {
      return res.status(403).send(error(403, "Incorrect Password"));
    }
    const token = signjwt(userExisted._id, userExisted.tokenVersion);
    return res.send(success(200, { token }));
  } catch (err) {
    return res.status(400).send(error(400, err.message));
  }
};

const getProfile = async (req, res) => {
  try {
    const user_Id = req.user.user_Id;
    const cacheKey = `v2:own-profile:${user_Id}`;

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
    if ([fullname, bio, email, dateOfBirth].some(value => value !== undefined && typeof value !== "string")) return res.status(400).json(error(400, "Invalid profile fields"));
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json(error(400, "Invalid email"));
    let updateFields = { fullname, bio, email, dateOfBirth };

    // Handle profile picture update
    if (req.file) {
      // Backend validation
      const fileType = validateFile(req.file);
      if (fileType !== "image") {
        return res.status(400).send(error(400, "Videos are not allowed for profile pictures."));
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
      new: true, runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).send(error(404, "User not found"));
    }

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await Promise.all([deleteCache(`v2:own-profile:${userId}`), require("../Utils/cache").deleteByPattern(`v2:profile:${userId}:*`)]);

    return res.send(
      success(200, { message: "Profile updated successfully", updatedUser })
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send(error(500, err.message));
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== "string") return res.status(400).json(error(400, "Email is required"));

    // Check if user exists
    const userProfile = await user.findOne({ email });
    if (!userProfile) {
      return res.status(200).json({ message: "If an account exists, a reset link will be sent." });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save token to user
    userProfile.resetPasswordToken = hashResetToken(resetToken);
    userProfile.resetPasswordExpires = resetTokenExpiry;
    await userProfile.save();

    // Send email via Resend
    const resetUrl = `${process.env.ORIGIN}/reset-password?token=${resetToken}`;

    const delivery = await resend.emails.send({
      from: "no-reply@resend.dev",
      to: email,
      subject: "Password Reset Request",
      html: getResetPasswordEmail(resetUrl, userProfile.fullname),
    });
    if (delivery.error) throw new Error("Reset email delivery failed");

    res.status(200).json({ message: "If an account exists, a reset link will be sent." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
};

// Reset password (using token)
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (typeof token !== "string" || !/^[a-f0-9]{40}$/.test(token) || !validPassword(newPassword)) return res.status(400).json(error(400, "Invalid token or password (8 characters minimum, 72 bytes maximum)"));

    // Find user by token & check expiry
    const passwordHash = await require('bcrypt').hash(newPassword, 10);
    const userProfile = await user.findOneAndUpdate({
      resetPasswordToken: hashResetToken(token), resetPasswordExpires: { $gt: Date.now() },
    }, {
      $set: { password: passwordHash }, $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }, $inc: { tokenVersion: 1 },
    }, { new: true });

    if (!userProfile) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    require("../socket").disconnectUser(userProfile._id);
    await deleteCache(`v2:own-profile:${userProfile._id}`);

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
