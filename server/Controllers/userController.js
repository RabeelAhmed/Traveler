const Post = require("../Models/post");
const user = require("../Models/User");
const mongoose = require("mongoose");
const { mapPostOutput } = require("../Utils/utils");
const { success, error } = require("../Utils/responseWrapper");
const { getTrendingPosts, getRandomPosts } = require("../Utils/helpers");
const Notification = require("../Models/notification");
const { notify } = require("../socket");
const { remember, deleteCache, TTL } = require("../Utils/cache");

const followAndUnfollow = async (req, res) => {
  try {
    const curUserId = req.user.user_Id;
    const { followId } = req.body;
    console.log(req.body);
    // Check for self-follow attempt
    if (curUserId === followId) {
      return res.status(400).send(error(400, "You can't follow yourself"));
    }

    // Fetch current user and the user to be followed/unfollowed
    const curUser = await user.findById(curUserId);
    const followUser = await user.findById(followId);

    if (!curUser) {
      return res.status(400).send(error(400, "Current user doesn't exist"));
    }

    if (!followUser) {
      return res
        .status(400)
        .send(error(400, "User to follow/unfollow doesn't exist"));
    }

    let isFollowing = curUser.following.includes(followId);

    // Follow or unfollow logic
    if (isFollowing) {
      // Unfollow
      curUser.following = curUser.following.filter(
        (id) => id.toString() !== followId.toString()
      );
      followUser.followers = followUser.followers.filter(
        (id) => id.toString() !== curUserId.toString()
      );
      console.log(
        "After unfollowing:",
        curUser.following,
        followUser.followers
      );
    } else {
      // Follow
      curUser.following.push(followId);
      followUser.followers.push(curUserId);
      
    }

    let achivement;
    if (followUser.followers.length === 0 ) {
      achivement = "adventurer";
      const hasBadge = followUser.badges.some(obj => obj.name === achivement);
    
      if (!hasBadge) {
        followUser.badges.push({
          name: achivement,
          awardedAt: new Date(),
        });
    
        await followUser.save();
        const notification = new Notification({
                    recipient: req.user.user_Id, // Post owner
                    sender: req.user.user_Id,
                    type: 'Achivement',
                    post: req.user.user_Id,
                  });
                  await notification.save();
                  notify(notification);
      }
    }

    // Save changes
    await curUser.save();
    await followUser.save();
    if(!isFollowing){
      const notification = new Notification({
        recipient: followId, // Post owner
        sender: curUserId,
        type: 'follow',
    })
    await notification.save();
    notify(notification)
    }

    // ── Cache Invalidation ──────────────────────────────────────────────────
    // Follow/unfollow changes the feed composition and profile follower counts
    await Promise.all([
      deleteCache(`feed:${curUserId}`),
      deleteCache(`profile:${curUserId}`),
      deleteCache(`profile:${followId}`),
    ]);

    return res.status(200).send(
      success(200, {
        message: isFollowing
          ? "User unfollowed successfully"
          : "User followed successfully",
        user: {
          username: followUser.username,
          followersCount: followUser.followers,
          followingCount: followUser.following,
          isFollowing: !isFollowing,
        },
        currentUser: {
          username: curUser.username,
          followersCount: curUser.followers,
          followingCount: curUser.following,
        },
      })
    );
  } catch (err) {
    console.error("Error in followAndUnfollow:", err);
    return res.status(500).send(error(500, "Something went wrong"));
  }
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
        .populate({ path: "userId" })
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
    return res.send(error(500, err.message));
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { _id } = req.params;
    const curUserId = req.user.user_Id;

    let targetId = _id;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      const foundUser = await user.findOne({ slug: _id });
      if (!foundUser) {
        return res.status(404).json({ message: "User not found" });
      }
      targetId = foundUser._id;
    }

    const cacheKey = `profile:${targetId}`;

    // We only cache the userProfile + posts; isFollowing is per-viewer so we compute it fresh
    const cached = await remember(cacheKey, TTL.PROFILE, async () => {
      const userProfile = await user.findById(targetId);
      if (!userProfile) return null;

      const allPosts = await userProfile.populate({
        path: "posts",
        populate: [
          { path: "userId" },
          { path: "journeyId" },
          {
            path: "comments",
            populate: { path: "userId", select: "fullname profilePicture" },
          },
        ],
      });

      const posts = allPosts.posts
        .map((item) => mapPostOutput(item, curUserId))
        .filter((item) => item !== null);

      return {
        _id: userProfile._id,
        fullname: userProfile.fullname,
        username: userProfile.username,
        profilePicture: userProfile.profilePicture,
        followers: userProfile.followers,
        following: userProfile.following,
        bio: userProfile.bio,
        posts: posts,
        slug: userProfile.slug,
      };
    });

    if (!cached) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = cached.followers
      ? cached.followers.some(
          (id) => id.toString() === curUserId
        )
      : false;

    return res.status(200).json({
      success: true,
      data: { userProfile: cached, posts: cached.posts, isFollowing },
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
    const notificationList = await Notification.find({ recipient: curUserId.toString() }).populate({
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
