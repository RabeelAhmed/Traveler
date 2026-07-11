const router = require('express').Router();
const { getLiveUsers } = require('../Controllers/liveController');
const { verifyAuthToken } = require('../Middleware/jwtAuthMiddleware');

router.get('/users', verifyAuthToken, getLiveUsers);

module.exports = router;
