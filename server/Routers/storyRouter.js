const router = require('express').Router()
const {addStory, getStories} = require('../Controllers/storyController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { singleUpload } = require('../Middleware/uploads');

router.post('/addstory',verifyAuthToken,singleUpload,addStory);
router.get('/getstories',verifyAuthToken,getStories);
module.exports = router;
