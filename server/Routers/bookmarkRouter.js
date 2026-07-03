const router = require("express").Router();
const { verifyAuthToken } = require("../Middleware/jwtAuthMiddleware");
const {
  toggleBookmark,
  getSavedPosts,
} = require("../Controllers/bookmarkController");

router.post("/toggle/:postId", verifyAuthToken, toggleBookmark);
router.get("/", verifyAuthToken, getSavedPosts);

module.exports = router;
