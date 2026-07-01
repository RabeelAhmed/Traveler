
const Journey = require("../Models/journey");
const Post = require("../Models/post");
const User = require("../Models/User");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput } = require("../Utils/utils");

const startJourney = async (req, res) => {
  try {
    const { title, description, location, media, rating, hashtags } = req.body;

    if (!title || !description || !location || !media) {
      return res.send(error(400, "All fields (title, description, location, media) are required to start a journey"));
    }

    const curUserId = req.user.user_Id;
    const author = await User.findById(curUserId);
    if (!author) {
      return res.send(error(404, "User not found"));
    }

    const parsedMedia = typeof media === "string" ? JSON.parse(media) : (media || []);
    const parsedHashtags = typeof hashtags === "string" ? JSON.parse(hashtags) : (hashtags || []);

    const journeyId = new mongoose.Types.ObjectId();

    // 1. Create first Post (Step 0)
    const newPost = await Post.create({
      userId: curUserId,
      title,
      description,
      location,
      rating: rating || 5, // Rating is conditionally required, default to 5 if not provided
      media: parsedMedia,
      hashtags: parsedHashtags,
      journeyId,
      stepIndex: 0,
    });

    // 2. Create the Journey
    const newJourney = await Journey.create({
      _id: journeyId,
      owner: curUserId,
      title,
      steps: [newPost._id],
      isActive: true,
      startedAt: new Date(),
    });

    // 3. Add Post to User's posts
    author.posts.push(newPost._id);
    await author.save();

    return res.send(
      success(201, {
        journey: newJourney,
        post: mapPostOutput(newPost, curUserId),
        message: "Journey started successfully",
      })
module.exports = {
  createJourney,
};
