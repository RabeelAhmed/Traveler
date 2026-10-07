const router = require('express').Router();
for (const param of ['id', '_id', 'userId', 'postId', 'conversationId']) router.param(param, require('../Middleware/validateId'));
const { getLiveUsers } = require('../Controllers/liveController');
const { verifyAuthToken } = require('../Middleware/jwtAuthMiddleware');

router.get('/users', verifyAuthToken, getLiveUsers);

module.exports = router;
