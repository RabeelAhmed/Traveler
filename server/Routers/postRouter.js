const router = require('express').Router()
const {createPost,likeAndUnlikePost,addComment,deleteComment,deletePost,getPost,searchAll, generateSignature, getTrendingDestinations, getTrendingTags, uploadMediaController} = require('../Controllers/postController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { upload, multipleUpload } = require('../Middleware/uploads');
const {optionalAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { createPostLimiter } = require('../Middleware/rateLimiter');

router.post('/createpost',verifyAuthToken, createPostLimiter, multipleUpload,createPost);
router.post('/upload-media',verifyAuthToken,upload.array('files', 8),uploadMediaController);
router.get('/signature',verifyAuthToken,generateSignature);
router.post('/likepost',verifyAuthToken,likeAndUnlikePost);
router.post('/addcomment',verifyAuthToken,addComment);
router.post('/deletecomment',verifyAuthToken,deleteComment);
router.post('/deletepost',verifyAuthToken,deletePost);
router.get("/search",verifyAuthToken, searchAll);
router.get('/trending-destinations', verifyAuthToken, getTrendingDestinations);
router.get('/trending-tags', verifyAuthToken, getTrendingTags);
router.get('/:_id',optionalAuthToken,getPost)

module.exports = router ;
