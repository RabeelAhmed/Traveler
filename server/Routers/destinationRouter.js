const router = require("express").Router();
const {
  getDestinations,
  getDestinationBySlug,
  getCuratedDestinations,
} = require("../Controllers/destinationController");
const { optionalAuthToken } = require("../Middleware/jwtAuthMiddleware");

router.get("/", optionalAuthToken, getDestinations);
router.get("/curated/:type", optionalAuthToken, getCuratedDestinations);
router.get("/:slug", optionalAuthToken, getDestinationBySlug);

module.exports = router;
