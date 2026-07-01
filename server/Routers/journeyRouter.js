const router = require("express").Router();
const {
  startJourney,
  addStep,
  endJourney,
  getJourney,
} = require("../Controllers/journeyController");
const { verifyAuthToken, optionalAuthToken } = require("../Middleware/jwtAuthMiddleware");

router.post("/start", verifyAuthToken, startJourney);
router.post("/:id/addstep", verifyAuthToken, addStep);
router.post("/:id/end", verifyAuthToken, endJourney);
router.get("/:id", optionalAuthToken, getJourney);

module.exports = router;
