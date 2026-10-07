const { signMedia, verifyMediaList } = require("../Utils/mediaReceipt");
const { escapeRegex, PUBLIC_USER_FIELDS } = require("../Utils/security");
const Post = require("../Models/post");
const user = require("../Models/User");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput } = require("../Utils/utils");
const { cloudinary, uploadToCloudinary, validateFile } = require("../Utils/cloudinaryConfig");
const Notification = require("../Models/notification");
const { notify, broadcastNewPost } = require("../socket");
const { remember, deleteCache, deleteByPattern, TTL } = require("../Utils/cache");

const invalidateSocialViews = () => Promise.all(['feed:*', 'v2:post:*', 'v2:profile:*', 'v2:own-profile:*', 'v2:search:*', 'trending:*'].map(pattern => require('../Utils/cache').deleteByPattern(pattern)));
const createPost = async (req, res) => {
  try {
    const { title, description, location, rating, tags, media, hashtags } = req.body;

    if (!title || !description || !location || !rating || !media || !hashtags) {
      return res.status(400).send(error(400, "All fields are required"));
    }

    const parsedMedia = typeof media === "string" ? JSON.parse(media) : media;
    const parsedHashtags = typeof hashtags === "string" ? JSON.parse(hashtags) : hashtags;

    if (!verifyMediaList(parsedMedia, req.user.user_Id)) {
      return res.status(400).send(error(400, "Media must come from your own uploads"));
    }

    if (tags && tags.length > 0) {
      const existingUsers = await user.find({ username: { $in: tags } });
      if (existingUsers.length !== tags.length) {
        return res.status(400).send(error(400, "Some tagged users do not exist"));
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
    await invalidateSocialViews();
      }
    }

    if (auther.posts.length === 99) {
      achivement = "Cultural_Traveler";
      const alreadyHasBadge = auther.badges?.some(b => b.name === achivement);
      if (!alreadyHasBadge) {
        auther.badges.push({ name: achivement, awardedAt: new Date() });
        await auther.save();
    await invalidateSocialViews();

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
    await invalidateSocialViews();

    // Real-time feed update: push the new post to all online followers
    if (auther.followers?.length > 0) {
      const populated = await Post.findById(newPost._id)
        .populate('userId', PUBLIC_USER_FIELDS)
        .populate({ path: 'comments', populate: { path: 'userId', select: 'fullname profilePicture' } });
      const mappedPost = mapPostOutput(populated, auther_Id);
      broadcastNewPost(auther.followers, mappedPost);
    }

    await invalidateSocialViews();
    // ── Cache Invalidation ──────────────────────────────────────────────────
    await Promise.all([
      deleteCache(`feed:${auther_Id}`),
      Promise.all([deleteCache(`v2:own-profile:${auther_Id}`), require("../Utils/cache").deleteByPattern(`v2:profile:${auther_Id}:*`)]),
      deleteCache('trending:destinations'),
      deleteCache('trending:tags'),
    ]);

    await invalidateSocialViews();
    const message = "Post has been uploaded";
    return res.send(success(201, { newPost, message, achivement }));

  } catch (err) {
    console.error("CreatePost Error:", err);
    return res.status(500).send(error(500, "Something went wrong"));
  }
};

const uploadMediaController = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(error(400, "No media files provided."));
    }

    let imageCount = 0;
    let videoCount = 0;
    const filesToUpload = [];

    for (const file of req.files) {
      const resourceType = validateFile(file);
      if (resourceType === 'image') {
        imageCount++;
      } else {
        videoCount++;
      }
      filesToUpload.push({ file, resourceType });
    }

    if (imageCount > 5) {
      return res.status(400).json(error(400, "Maximum 5 images allowed."));
    }
    if (videoCount > 3) {
      return res.status(400).json(error(400, "Maximum 3 videos allowed."));
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
    const media = [];

    if (cloudName === "dummy" || !cloudName) {
      for (const item of filesToUpload) {
        const mimeType = item.file.mimetype || (item.resourceType === 'image' ? 'image/jpeg' : 'video/mp4');
        const base64Data = `data:${mimeType};base64,${item.file.buffer.toString("base64")}`;
        media.push({
          url: base64Data,
          publicId: "dummy_post_media_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
          resourceType: item.resourceType
        });
      }
    } else {
      const uploadPromises = filesToUpload.map(item =>
        uploadToCloudinary(item.file.buffer, "traveler/posts", item.file.mimetype)
      );
      const results = await Promise.all(uploadPromises);
      for (const resItem of results) {
        media.push({
          url: resItem.url,
          publicId: resItem.publicId,
          resourceType: resItem.resourceType
        });
      }
    }

    for (const item of media) item.receipt = signMedia(item, req.user.user_Id, "post");
    return res.send(success(200, { media }));
  } catch (err) {
    console.error("uploadMediaController error:", err);
    return res.status(400).send(error(400, err.message));
  }
};

const generateSignature = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const folder = "Post_Media";

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );

  const data = {
    signature,
    timestamp,
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.API_KEY,
    folder,
  };

  return res.send(success(201, { data }));
};


const likeAndUnlikePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const curUserId = req.user.user_Id;

    const post = await Post.findById(postId).populate("userId", PUBLIC_USER_FIELDS);
    const postOwner = await user.findById(post.userId);
    if (!post) {
      return res.status(404).json(error(404, "Post Not Found"));
    }

    const isLiked = post.likes.includes(curUserId);

    const updateOperation = isLiked
      ? { $pull: { likes: curUserId } }
      : { $addToSet: { likes: curUserId } };

    let achivement;
    if (post.likes.length === 0 && !isLiked) {
      achivement = "explorer";

      const hasBadge = postOwner.badges.some((obj) => obj.name === achivement);

      if (!hasBadge) {
        postOwner.badges.push({
          name: achivement,
          awardedAt: new Date(),
        });

        await postOwner.save();
        const notification = new Notification({
          recipient: post.userId._id,
          sender: post.userId._id,
          type: "Achivement",
          post: postId,
        });
        await notification.save();
        notify(notification);
      }
    }

    const message = isLiked
      ? "You have unliked the post."
      : "You have liked the post.";
    const updatedPost = await Post.findByIdAndUpdate(postId, updateOperation, {
      new: true,
    }).populate("userId", PUBLIC_USER_FIELDS);
    const responsePost = await updatedPost.populate({
      path: "comments",
      populate: {
        path: "userId",
        select: "fullname profilePicture",
      },
    });
    if (!isLiked) {
      if (!(post.userId._id.toString() === curUserId)) {
        const notification = new Notification({
          recipient: post.userId._id,
          sender: curUserId,
          type: "like",
          post: postId,
        });
        await notification.save();
        notify(notification);
      }
    }

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await Promise.all([
      require("../Utils/cache").deleteByPattern(`v2:post:${postId}:*`),
      deleteCache(`feed:${curUserId}`),
    ]);

    return res
      .status(200)
      .json(
        success(200, { post: mapPostOutput(responsePost, curUserId), message })
      );
  } catch (err) {
    console.error("Error in likeAndUnlikePost:", err);
    return res.status(500).json(error(500, "Something went wrong"));
  }
};

const addComment = async (req, res) => {
  try {
    const { postId, commentText } = req.body;
    const curUserId = req.user.user_Id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(error(404, "Post Not Found"));
    }
    const postOwner = await user.findById(post.userId);
    const comment = {
      userId: curUserId,
      commentText: commentText,
    };

    let achivement;
    if (post.comments.length === 0) {
      achivement = "Nature_Lover";
      const hasBadge = postOwner.badges.some((obj) => obj.name === achivement);

      if (!hasBadge) {
        postOwner.badges.push({
          name: achivement,
          awardedAt: new Date(),
        });

        await postOwner.save();
        const notification = new Notification({
          recipient: post.userId,
          sender: post.userId,
          type: "Achivement",
          post: postId,
        });
        await notification.save();
        notify(notification);
      }
    }

    post.comments.push(comment);
    await post.save();
    await invalidateSocialViews();

    let responsePost = await Post.findById(postId)
      .populate({ path: "userId", select: PUBLIC_USER_FIELDS })
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "fullname profilePicture",
        },
      });
    responsePost = mapPostOutput(responsePost, curUserId);
    responsePost.comments = responsePost.comments.reverse();

    if (post.userId.toString() !== curUserId) {
      const notification = new Notification({
        recipient: post.userId,
        sender: curUserId,
        type: "comment",
        post: postId,
      });
      await notification.save();
      notify(notification);
    }

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await require("../Utils/cache").deleteByPattern(`v2:post:${postId}:*`);

    return res.status(200).json(success(200, { responsePost }));
  } catch (err) {
    console.error("Error in addComment:", err);
    return res.status(500).send(error(500, "Something went wrong"));
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;
    const curUserId = req.user.user_Id;

    const post = await Post.findById(postId).populate("comments.userId");
    if (!post) {
      return res.status(404).json(error(404, "Post Not Found"));
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json(error(404, "Comment Not Found"));
    }

    if (comment.userId._id.toString() === curUserId) {
      post.comments.pull(commentId);
      await post.save();
    await invalidateSocialViews();

      // ── Cache Invalidation ──────────────────────────────────────────────
      await require("../Utils/cache").deleteByPattern(`v2:post:${postId}:*`);

      return res
        .status(200)
        .json(success(200, { post: mapPostOutput(post, curUserId) }));
    } else {
      return res
        .status(403)
        .json(error(403, "Unauthorized to delete this comment"));
    }
  } catch (err) {
    return res.status(500).send(error(500, "Something went wrong"));
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const curUserId = req.user.user_Id;
    const post = await Post.findById(postId).populate("userId", PUBLIC_USER_FIELDS);
    const curUser = await user.findById(curUserId);
    if (!post) {
      return res.status(404).send(error(404, "Post Not Found"));
    }
    if (post.userId._id.toString() !== curUserId) {
      return res.status(403).send(error(403, "Only Owners can Delete Their Post"));
    }
    const index = curUser.posts.indexOf(postId);
    if (index > -1) {
      curUser.posts.splice(index, 1);
      await curUser.save();
    }

    await Post.findByIdAndDelete(postId);
    await invalidateSocialViews();

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await Promise.all([
      require("../Utils/cache").deleteByPattern(`v2:post:${postId}:*`),
      deleteCache(`feed:${curUserId}`),
      Promise.all([deleteCache(`v2:own-profile:${curUserId}`), require("../Utils/cache").deleteByPattern(`v2:profile:${curUserId}:*`)]),
      deleteCache('trending:destinations'),
      deleteCache('trending:tags'),
    ]);

    return res
      .status(200)
      .json(success(200, { post: mapPostOutput(post, curUserId) }));
  } catch (err) {
    return res.status(500).send(error(500, "Something went wrong"));
  }
};

const getPost = async (req, res) => {
  try {
    const { _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).send(error(400, "Invalid post ID"));
    }

    const curUserId = req.user?.user_Id || null;
    const cacheKey = `v2:post:${_id}:${curUserId || "guest"}`;

    const postData = await remember(cacheKey, TTL.POST, async () => {
      const post = await Post.findById(_id)
        .populate("userId", PUBLIC_USER_FIELDS)
        .populate("comments.userId");

      if (!post) return null;
      return mapPostOutput(post, curUserId);
    });

    if (!postData) {
      return res.status(404).send(error(404, "Post Not Found"));
    }

    return res.status(200).send(success(200, { post: postData }));
  } catch (err) {
    console.error(err);
    return res.status(500).send(error(500, "Something went wrong"));
  }
};


const searchAll = async (req, res) => {
  try {
    let { query } = req.query;
    const curUserId = req.user.user_Id;

    if (!query || query.trim() === "") {
      return res.status(400).json(error(400, "Search query is required"));
    }

    query = query.trim();

    // Remove leading # if present
    if (query.startsWith("#")) {
      query = query.slice(1);
    }

    if (query.length > 100) return res.status(400).json(error(400, "Search is limited to 100 characters"));
    const searchPattern = escapeRegex(query);
    const cacheKey = `v2:search:${curUserId}:${query.toLowerCase()}`;

    const results = await remember(cacheKey, TTL.SEARCH, async () => {
      const users = await user
        .find({
          $or: [
            { fullname: { $regex: searchPattern, $options: "i" } },
            { username: { $regex: searchPattern, $options: "i" } },
            { bio: { $regex: searchPattern, $options: "i" } },
          ],
        })
        .select("username fullname profilePicture bio");

      const postFilter = {
        $or: [
          { title: { $regex: searchPattern, $options: "i" } },
          { description: { $regex: searchPattern, $options: "i" } },
          { location: { $regex: searchPattern, $options: "i" } },
          { hashtags: { $regex: searchPattern, $options: "i" } },
        ],
      };

      const posts = await Post.find(postFilter)
        .populate("userId", "fullname username profilePicture")
        .populate("journeyId")
        .populate({
          path: "comments",
          populate: { path: "userId", select: "fullname profilePicture" },
        });

      const formattedPosts = posts.map((post) => mapPostOutput(post, curUserId));
      return { users, posts: formattedPosts };
    });

    return res.status(200).json(success(200, results));
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json(error(500, "Internal Server Error"));
  }
};


const getTrendingDestinations = async (req, res) => {
  try {
    const destinations = await remember('trending:destinations', TTL.TRENDING, async () => {
      return await Post.aggregate([
        {
          $group: {
            _id: '$location',
            postCount: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            thumbnail: { $first: { $arrayElemAt: ['$media', 0] } },
          },
        },
        { $sort: { postCount: -1 } },
        { $limit: 20 },
        {
          $project: {
            location: '$_id',
            postCount: 1,
            avgRating: 1,
            thumbnail: 1,
            _id: 0,
          },
        },
      ]);
    });

    return res.status(200).send(success(200, { destinations }));
  } catch (err) {
    console.error('getTrendingDestinations error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

const getTrendingTags = async (req, res) => {
  try {
    const tags = await remember('trending:tags', TTL.TRENDING, async () => {
      return await Post.aggregate([
        { $unwind: '$hashtags' },
        { $match: { hashtags: { $ne: '', $exists: true } } },
        { $group: { _id: '$hashtags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
        { $project: { tag: '$_id', count: 1, _id: 0 } },
      ]);
    });

    return res.send(success(200, { tags }));
  } catch (err) {
    console.error('getTrendingTags error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

module.exports = {
  createPost,
  likeAndUnlikePost,
  addComment,
  deleteComment,
  deletePost,
  getPost,
  searchAll,
  generateSignature,
  uploadMediaController,
  getTrendingDestinations,
  getTrendingTags,
};
