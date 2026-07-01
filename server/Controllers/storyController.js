
const story = require("../Models/story");
const user = require("../Models/User");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput, mapStoryOutput } = require("../Utils/utils");
const express = require("express");
const cloudinary = require("../Utils/cloudinaryConfig");
const dotenv = require("dotenv");
const Notification = require("../Models/notification");
const Story = require("../Models/story");
const { notify } = require("../socket");
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

const getStory = async(req,res) => {
  const allStory = await story.find().populate('userId', 'profilePicture');
  const curUserId = req.user?.userId;
  return res.json(success(201,{
    stories: allStory.map((story) => mapStoryOutput(story, curUserId)),
  }
  ))
}

const likeAndUnlikeStory = async (req, res) => {
  try {
    const { storyId } = req.body;
    const curUserId = req.user?.userId; // Ensure user is authenticated

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
module.exports = {
  addStory,
  getStories,
};
