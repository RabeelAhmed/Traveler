const router = require('express').Router()
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const {followAndUnfollow,getFeedData,getUserProfile,getNotifications,getVisitedLocations} = require('../Controllers/userController');

router.post('/follow',verifyAuthToken,followAndUnfollow);
router.get('/feed' ,verifyAuthToken, getFeedData);
router.get('/getuserprofile/:_id',verifyAuthToken,getUserProfile);
router.get('/getnotification',verifyAuthToken,getNotifications);
router.get('/visited/:userId',verifyAuthToken,getVisitedLocations);


module.exports = router;