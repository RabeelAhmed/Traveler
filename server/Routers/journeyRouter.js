const router = require("express").Router();
const {
  startJourney,
  addStep,
  endJourney,
  getJourney,
  inviteCollaborator,
  respondToInvite,
  removeCollaborator,
  getCollaboratingJourneys,
} = require("../Controllers/journeyController");
const { verifyAuthToken, optionalAuthToken } = require("../Middleware/jwtAuthMiddleware");

router.post("/start", verifyAuthToken, startJourney);
// Named routes must come before /:id to prevent route collision
router.get("/collaborating", verifyAuthToken, getCollaboratingJourneys);
router.post("/:id/addstep", verifyAuthToken, addStep);
router.post("/:id/end", verifyAuthToken, endJourney);
router.get("/:id", optionalAuthToken, getJourney);
// Collaborative journey routes
router.post("/:id/invite", verifyAuthToken, inviteCollaborator);
router.post("/:id/invite/respond", verifyAuthToken, respondToInvite);
router.delete("/:id/collaborator/:userId", verifyAuthToken, removeCollaborator);

module.exports = router;
