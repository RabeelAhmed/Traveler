const router = require('express').Router()
const {addStory,generateSignature,getStory,likeAndUnlikeStory,uploadStoryMediaController} = require('../Controllers/storyController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { upload, storyUpload } = require('../Middleware/uploads');

router.post('/addstory',verifyAuthToken,addStory);
router.post('/upload-media',verifyAuthToken,upload.single('file'),uploadStoryMediaController);
router.get('/generate-signature',generateSignature),
router.get('/getstory',verifyAuthToken,getStory);
router.post('/like',verifyAuthToken,likeAndUnlikeStory);
module.exports = router;