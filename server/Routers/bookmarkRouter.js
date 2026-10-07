const router = require("express").Router();
for (const param of ['id', '_id', 'userId', 'postId', 'conversationId']) router.param(param, require('../Middleware/validateId'));
const { verifyAuthToken } = require("../Middleware/jwtAuthMiddleware");
const {
  toggleBookmark,
  getSavedPosts,
} = require("../Controllers/bookmarkController");

router.post("/toggle/:postId", verifyAuthToken, toggleBookmark);
router.get("/", verifyAuthToken, getSavedPosts);

module.exports = router;
