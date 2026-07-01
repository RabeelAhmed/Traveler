const router = require('express').Router()
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const {followAndUnfollow, getNotifications} = require('../Controllers/userController');

router.post('/follow',verifyAuthToken,followAndUnfollow);
router.get('/getnotification',verifyAuthToken,getNotifications);
module.exports = router;
