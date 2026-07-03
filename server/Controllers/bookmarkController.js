const User = require("../Models/User");
const { mapPostOutput } = require("../Utils/utils");
const { success, error } = require("../Utils/responseWrapper");

const toggleBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const curUserId = req.user.user_Id;

    const curUser = await User.findById(curUserId);
    if (!curUser) {
      return res.status(404).send(error(404, "User not found"));
    }

    let isSaved = false;
    const isAlreadySaved = curUser.savedPosts.some(
      (id) => id && id.toString() === postId
    );

    if (isAlreadySaved) {
      curUser.savedPosts.pull(postId);
      isSaved = false;
    } else {
      curUser.savedPosts.push(postId);
      isSaved = true;
    }

    await curUser.save();
    return res.status(200).send(
      success(200, {
        isSaved,
        savedCount: curUser.savedPosts.length,
      })
    );
  } catch (err) {
    console.error("Error in toggleBookmark:", err);
    return res.status(500).send(error(500, err.message || "Something went wrong"));
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const curUserId = req.user.user_Id;

    const curUser = await User.findById(curUserId).populate({
      path: "savedPosts",
      populate: [
        { path: "userId" },
        { path: "journeyId" },
        {
          path: "comments",
          populate: {
            path: "userId",
            select: "fullname profilePicture",
          },
        },
      ],
    });

    if (!curUser) {
      return res.status(404).send(error(404, "User not found"));
    }

    const posts = curUser.savedPosts
      .filter((post) => post !== null)
      .map((post) => mapPostOutput(post, curUserId));

    return res.status(200).send(success(200, { posts }));
  } catch (err) {
    console.error("Error in getSavedPosts:", err);
    return res.status(500).send(error(500, err.message || "Something went wrong"));
  }
};

module.exports = {
  toggleBookmark,
  getSavedPosts,
};
