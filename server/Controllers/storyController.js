const story = require("../Models/story");
const user = require("../Models/User");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput, mapStoryOutput } = require("../Utils/utils");
const express = require("express");
const { cloudinary, uploadToCloudinary, validateFile } = require("../Utils/cloudinaryConfig");
const dotenv = require("dotenv");
const Notification = require("../Models/notification");
const Story = require("../Models/story");
const { notify } = require("../socket");
const { remember, deleteCache, TTL } = require("../Utils/cache");
dotenv.config();

const addStory = async (req, res) => {
  try {
    const { title, lat, long, url, publicId } = req.body;

    // Validate required fields
    const requiredFields = { title, lat, long, url, publicId };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Validate coordinates
    if (isNaN(lat) || isNaN(long) || lat < -90 || lat > 90 || long < -180 || long > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided",
      });
    }

    // Check authentication
    if (!req.user?.user_Id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not logged in",
      });
    }

    // Find user and validate
    const author = await user.findById(req.user.user_Id).select('+badges');
    if (!author) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create story
    const newStory = await story.create({
      title,
      location: { 
        latitude: parseFloat(lat), 
        longitude: parseFloat(long) 
      },
      userId: req.user.user_Id,
      video: {
        url,
        publicId
      }
    });

    // Achievement logic
    const achievement = "nomad";
    const alreadyHasBadge = author.badges?.some(badge => badge.name === achievement);

    if (!alreadyHasBadge) {
      // Initialize badges array if it doesn't exist
      if (!author.badges) {
        author.badges = [];
      }
      
      // Add new badge
      author.badges.push({
        name: achievement,
        awardedAt: new Date(),
      });

      // Create notification
      const notification = new Notification({
        recipient: author._id,
        sender: author._id,
        type: 'Achievement',
        post: newStory._id,
      });

      // Save changes in parallel
      await Promise.all([
        author.save(),
        notification.save()
      ]);

      // Notify user
      notify(notification);
    }

    // Add story to user's stories
    author.stories.push(newStory._id);
    await author.save();

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await deleteCache('stories');

    // Prepare response
    const mappedStory = mapStoryOutput(newStory, author);
    
    return res.status(201).json({
      success: true,
      message: "Story has been uploaded successfully",
      data: {
        story: mappedStory
      }
    });

  } catch (err) {
    console.error("Error in addStory:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const uploadStoryMediaController = async (req, res) => {
  try {
    if (!req.file) {
      return res.send(error(400, "No file provided for story media."));
    }

    // Backend validation: 1 file, image (<=10MB) or video (<=100MB)
    const resourceType = validateFile(req.file);

    // Check cloudName bypass
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
    if (cloudName === "dummy" || !cloudName) {
      const mimeType = req.file.mimetype || (resourceType === 'image' ? 'image/jpeg' : 'video/mp4');
      const base64Data = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
      return res.send(success(200, {
        url: base64Data,
        publicId: "dummy_story_" + Date.now(),
        resourceType
      }));
    }

    // Upload to traveler/stories folder
    const result = await uploadToCloudinary(req.file.buffer, "traveler/stories", req.file.mimetype);
    return res.send(success(200, {
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType
    }));
  } catch (err) {
    console.error("uploadStoryMediaController error:", err);
    return res.send(error(400, err.message));
  }
};

const generateSignature = (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      timestamp,
      folder: "Story_Media",
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    if (!signature) {
      throw new Error("Failed to generate signature");
    }

    return res.status(200).json({
      success: true,
      data: {
        signature,
        timestamp,
        cloudName: process.env.CLOUD_NAME,
        apiKey: process.env.API_KEY,
      }
    });

  } catch (err) {
    console.error("Error in generateSignature:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Cloudinary signature",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
const getStory = async(req,res) => {
  try {
    const curUserId = req.user?.user_Id;
    const stories = await remember('stories', TTL.STORIES, async () => {
      const allStory = await story.find().populate('userId', 'profilePicture');
      return allStory.map((s) => mapStoryOutput(s, curUserId));
    });
    return res.json(success(201, { stories }));
  } catch (err) {
    console.error('getStory error:', err);
    return res.status(500).json(error(500, 'Something went wrong'));
  }
}

const likeAndUnlikeStory = async (req, res) => {
  try {
    const { storyId } = req.body;
    const curUserId = req.user?.user_Id; // Ensure user is authenticated

    if (!storyId) {
      return res.status(400).json({ success: false, message: "Story ID is required" });
    }

    console.log("StoryId:", storyId, "Current User Id:", curUserId);

    // Validate MongoDB ObjectId format
    if (!storyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid Story ID format" });
    }

    // Fetch the story and handle cases where it is not found
    const curStory = await story.findById(storyId).populate('userId', 'profilePicture');;
    if (!curStory) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    if (!curStory.likes) {
      return res.status(500).json({ success: false, message: "Likes field is missing in the story document" });
    }

    // Check if user already liked the story
    const isLiked = curStory.likes.includes(curUserId);

    if (isLiked) {
      curStory.likes.pull(curUserId);
    } else {
      curStory.likes.push(curUserId);
    }

    await curStory.save(); // Save updated likes

    const ownerId = curStory.userId?._id || curStory.userId;
    if (!isLiked && ownerId.toString() !== curUserId.toString()) {
      const notification = new Notification({
        recipient: ownerId,
        sender: curUserId,
        type: "story_like",
        story: storyId,
      });
      await notification.save();
      notify(notification);
    }

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await deleteCache('stories');

    return res.status(200).json({
      success: true,
      message: isLiked ? "Story unliked successfully" : "Story liked successfully",
      story: mapStoryOutput(curStory,curUserId)
    });

  } catch (error) {
    console.error("Error in likeAndUnlikeStory:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later",
      error: error.message,
    });
  }
};




module.exports = { addStory,generateSignature,getStory,likeAndUnlikeStory,uploadStoryMediaController };
