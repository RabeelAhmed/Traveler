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
    );
  } catch (err) {
    console.error("StartJourney Error:", err);
    return res.send(error(500, "Something went wrong starting the journey"));
  }
};

const addStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, location, media, rating, hashtags } = req.body;

    if (!description || !location || !media) {
      return res.send(error(400, "All fields (description, location, media) are required to add a step"));
    }

    const curUserId = req.user.user_Id;
    const journey = await Journey.findById(id);

    if (!journey) {
      return res.send(error(404, "Journey not found"));
    }

    if (!journey.isActive) {
      return res.send(error(400, "This journey is completed. No more steps can be added."));
    }

    if (journey.owner.toString() !== curUserId) {
      return res.send(error(403, "Only the owner can add steps to this journey"));
    }

    const author = await User.findById(curUserId);
    if (!author) {
      return res.send(error(404, "User not found"));
    }

    const parsedMedia = typeof media === "string" ? JSON.parse(media) : (media || []);
    const parsedHashtags = typeof hashtags === "string" ? JSON.parse(hashtags) : (hashtags || []);
    const stepIndex = journey.steps.length;

    // Create the Post for this step
    const newPost = await Post.create({
      userId: curUserId,
      title: `${journey.title} - Stop ${stepIndex + 1}`,
      description,
      location,
      rating: rating || 5,
      media: parsedMedia,
      hashtags: parsedHashtags,
      journeyId: journey._id,
      stepIndex,
    });

    // Push step post to journey
    journey.steps.push(newPost._id);
    await journey.save();

    // Push post to user posts
    author.posts.push(newPost._id);
    await author.save();

    return res.send(
      success(201, {
        post: mapPostOutput(newPost, curUserId),
        message: "Step added successfully",
      })
    );
  } catch (err) {
    console.error("AddStep Error:", err);
    return res.send(error(500, "Something went wrong adding step"));
  }
};

const endJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const curUserId = req.user.user_Id;
    const journey = await Journey.findById(id);

    if (!journey) {
      return res.send(error(404, "Journey not found"));
    }

    if (journey.owner.toString() !== curUserId) {
      return res.send(error(403, "Only the owner can complete this journey"));
    }

    journey.isActive = false;
    journey.endedAt = new Date();
    await journey.save();

    return res.send(
      success(200, {
        journey,
        message: "Journey completed successfully",
      })
    );
  } catch (err) {
    console.error("EndJourney Error:", err);
    return res.send(error(500, "Something went wrong completing the journey"));
  }
};

const getJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const curUserId = req.user?.user_Id;

    const journey = await Journey.findById(id)
      .populate("owner", "fullname username profilePicture")
      .populate({
        path: "steps",
        populate: [
          {
            path: "userId",
          },
          {
            path: "comments",
            populate: {
              path: "userId",
              select: "fullname profilePicture",
            },
          },
        ],
      });

    if (!journey) {
      return res.send(error(404, "Journey not found"));
    }

    // Format steps using mapPostOutput to match feed post structure
    const mappedSteps = journey.steps.map((step) => mapPostOutput(step, curUserId));

    return res.send(
      success(200, {
        journey: {
          _id: journey._id,
          owner: journey.owner,
          title: journey.title,
          isActive: journey.isActive,
          startedAt: journey.startedAt,
          endedAt: journey.endedAt,
          steps: mappedSteps,
        },
      })
    );
  } catch (err) {
    console.error("GetJourney Error:", err);
    return res.send(error(500, "Something went wrong retrieving journey details"));
  }
};

module.exports = {
  startJourney,
  addStep,
  endJourney,
  getJourney,
};
