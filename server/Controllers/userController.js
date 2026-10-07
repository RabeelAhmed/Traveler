const { PUBLIC_USER_FIELDS, profileCacheKey } = require("../Utils/security");
const Post = require("../Models/post");
const user = require("../Models/User");
const mongoose = require("mongoose");
const { mapPostOutput } = require("../Utils/utils");
const { success, error } = require("../Utils/responseWrapper");
const { getTrendingPosts, getRandomPosts } = require("../Utils/helpers");
const Notification = require("../Models/notification");
const { notify } = require("../socket");
const { remember, deleteCache, TTL } = require("../Utils/cache");

const invalidateSocialViews = () => Promise.all(['feed:*', 'v2:post:*', 'v2:profile:*', 'v2:own-profile:*', 'v2:search:*', 'trending:*'].map(pattern => require('../Utils/cache').deleteByPattern(pattern)));
const followAndUnfollow = async (req, res) => {
  try {
    const curUserId = req.user.user_Id;
    const { followId } = req.body;
    if (!mongoose.isValidObjectId(followId) || followId === curUserId) return res.status(400).json(error(400, 'Invalid follow target'));
    let isFollowing, curUser, followUser, followNotification;
    await mongoose.connection.transaction(async session => {
      curUser = await user.findById(curUserId).session(session);
      followUser = await user.findById(followId).session(session);
      if (!curUser || !followUser) throw new Error('User not found');
      isFollowing = curUser.following.some(id => String(id) === followId);
      const operation = isFollowing ? '$pull' : '$addToSet';
      await user.updateOne({ _id: curUserId }, { [operation]: { following: followId } }, { session });
      await user.updateOne({ _id: followId }, { [operation]: { followers: curUserId } }, { session });
      if (!isFollowing) [followNotification] = await Notification.create([{ recipient: followId, sender: curUserId, type: 'follow' }], { session });
    });
    if (followNotification) notify(followNotification);
    await invalidateSocialViews();
    curUser = await user.findById(curUserId);
    followUser = await user.findById(followId);
    return res.json(success(200, {
      message: isFollowing ? 'User unfollowed successfully' : 'User followed successfully',
      user: { username: followUser.username, followersCount: followUser.followers, followingCount: followUser.following, isFollowing: !isFollowing },
      currentUser: { username: curUser.username, followersCount: curUser.followers, followingCount: curUser.following },
    }));
  } catch (err) { console.error('Follow update failed:', err.message); return res.status(500).json(error(500, 'Could not update following')); }
};

const getFeedData = async (req, res) => {
  try {
    const curUserId = req.user.user_Id;
    const cacheKey = `feed:${curUserId}`;

    const posts = await remember(cacheKey, TTL.FEED, async () => {
      // Fetch the current user and populate 'following'
      const curUser = await user.findById(curUserId);
      // Get the IDs of the users that the current user follows
      const followingIds = curUser.following.map((item) => item._id);
      followingIds.push(req.user.user_Id); // Add current user's own ID to include their own posts in the feed

      const followingPosts = await Post.find({
        userId: { $in: followingIds },
      })
        .populate({ path: "userId", select: PUBLIC_USER_FIELDS })
        .populate("journeyId")
        .populate({
          path: "comments",
          populate: {
            path: "userId",
            select: "fullname profilePicture",
          },
        });

      const trending = await getTrendingPosts();
      console.log('After Treanding :', trending);

      const postMap = new Map();
      followingPosts.forEach((post) => {
        postMap.set(post._id.toString(), post);
      });
      trending.forEach((post) => {
        if (!postMap.has(post._id.toString())) {
          postMap.set(post._id.toString(), post);
        }
      });

      const fullPosts = Array.from(postMap.values());
      return fullPosts
        .map((item) => mapPostOutput(item, curUserId))
        .reverse();
    });

    return res.send(success(200, posts));
  } catch (err) {
    return res.status(500).send(error(500, err.message));
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { _id } = req.params;
    console.log(_id);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const curUserId = req.user.user_Id;
    const cacheKey = profileCacheKey(_id, curUserId);

    // We only cache the userProfile + posts; isFollowing is per-viewer so we compute it fresh
    const cached = await remember(cacheKey, TTL.PROFILE, async () => {
      const userProfile = await user.findById(_id).select(PUBLIC_USER_FIELDS + " posts");
      if (!userProfile) return null;

      const allPosts = await userProfile.populate({
        path: "posts",
        populate: [
          { path: "userId", select: PUBLIC_USER_FIELDS },
          { path: "journeyId" },
          {
            path: "comments",
            populate: { path: "userId", select: "fullname profilePicture" },
          },
        ],
      });

      const posts = allPosts.posts
        .map((item) => mapPostOutput(item, curUserId))
        .reverse();

      return { userProfile, posts };
    });

    if (!cached) {
      return res.status(404).json({ message: "User not found" });
    }

    const { userProfile, posts } = cached;
    const isFollowing = userProfile.followers
      ? userProfile.followers.some(
          (id) => id.toString() === curUserId
        )
      : false;

    return res.status(200).json({
      success: true,
      data: { userProfile, posts, isFollowing },
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


const getNotifications = async (req,res) => {
  // Notifications are real-time and never cached
  try {
    const curUserId = req.user.user_Id;
    const notificationList = await Notification.find({ recipient: curUserId.toString() }).sort({ createdAt: -1 }).limit(100).populate({
      path: 'sender',
      select: 'profilePicture username',
    });

    return res.status(200).json({ success: true, notifications: notificationList });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const getVisitedLocations = async (req, res) => {
  try {
    const { userId } = req.params;
    const locations = await Post.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $project: { location: '$_id', count: 1, _id: 0 } },
    ]);
    return res.status(200).json(success(200, { locations }));
  } catch (err) {
    console.error('getVisitedLocations error:', err);
    return res.status(500).json(error(500, 'Something went wrong'));
  }
};


module.exports = { followAndUnfollow, getFeedData, getUserProfile, getNotifications, getVisitedLocations };
