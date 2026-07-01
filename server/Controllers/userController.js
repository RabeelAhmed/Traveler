
const Post = require("../Models/post");
const user = require("../Models/User");
const mongoose = require("mongoose");
const { mapPostOutput } = require("../Utils/utils");
const { success, error } = require("../Utils/responseWrapper");
const { getTrendingPosts, getRandomPosts } = require("../Utils/helpers");
const Notification = require("../Models/notification");
const { notify } = require("../socket");

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
module.exports = {
  followAndUnfollow,
};
