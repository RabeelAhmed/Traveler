
const Post = require("../Models/post");
const user = require("../Models/User");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput } = require("../Utils/utils");
const cloudinary = require("../Utils/cloudinaryConfig");
const Notification = require("../Models/notification");
const { notify } = require("../socket");
const createPost = async (req, res) => {
  try {
    const { title, description, location, rating, tags, media, hashtags } = req.body;

    if (!title || !description || !location || !rating || !media || !hashtags) {
      return res.send(error(400, "All fields are required"));
    }

    const parsedMedia = JSON.parse(media);
    const parsedHashtags = JSON.parse(hashtags);

    if (!Array.isArray(parsedMedia)) {
      return res.send(error(400, "Media must be an array"));
    }

    if (tags && tags.length > 0) {
      const existingUsers = await user.find({ username: { $in: tags } });
      if (existingUsers.length !== tags.length) {
        return res.send(error(400, "Some tagged users do not exist"));
      }
    }

    const auther_Id = req.user.user_Id;
    const auther = await user.findById(auther_Id);
    let achivement;

    if (auther.posts.length === 0) {
      achivement = "first_Step";
      const alreadyHasBadge = auther.badges?.some(b => b.name === achivement);
      if (!alreadyHasBadge) {
        auther.badges = auther.badges || [];
        auther.badges.push({ name: achivement, awardedAt: new Date() });
        await auther.save();
      }
    }

    if (auther.posts.length === 99) {
      achivement = "Cultural_Traveler";
      const alreadyHasBadge = auther.badges?.some(b => b.name === achivement);
      if (!alreadyHasBadge) {
        auther.badges.push({ name: achivement, awardedAt: new Date() });
        await auther.save();

        const notification = new Notification({
          recipient: req.user.user_Id,
          sender: req.user.user_Id,
          type: "Achivement",
          post: req.user.user_Id,
        });

        await notification.save();
        notify(notification);
      }
    }

    const newPost = await Post.create({
      userId: req.user.user_Id,
      title,
      description,
      location,
      hashtags: parsedHashtags,
      rating,
      tags: tags || [],
      media: parsedMedia,
    });

    auther.posts.push(newPost._id);
    await auther.save();

    const message = "Post has been uploaded";
    return res.send(success(201, { newPost, message, achivement }));

  } catch (err) {
    console.error("CreatePost Error:", err);
    return res.send(error(500, "Something went wrong"));
  }
};
const generateSignature = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const folder = "Post_Media"; // ✅ Correct format

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET
  );

  const data = {
    signature,
    timestamp,
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.API_KEY,
    folder, // Include the folder so frontend knows where to upload
  };

  return res.send(success(201, { data }));
};
const getPost = async (req, res) => {
  try {
    const { _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).send(error("Invalid post ID"));
    }

    const post = await Post.findById(_id)
      .populate("userId")
      .populate("comments.userId");

    if (!post) {
      return res.status(404).send(error("Post Not Found"));
    }

    const curUserId = req.user?.user_Id || null;

    return res.status(200).send(
      success(200, {
        post: mapPostOutput(post, curUserId),
      })
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send(error("Something went wrong"));
  }
};
module.exports = {
  createPost,
  getPost,
  generateSignature,
};
