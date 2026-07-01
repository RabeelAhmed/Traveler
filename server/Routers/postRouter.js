const router = require('express').Router()
const {createPost,likeAndUnlikePost,addComment,deleteComment,getPost, generateSignature} = require('../Controllers/postController')
const {verifyAuthToken, optionalAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { multipleUpload } = require('../Middleware/uploads');

router.post('/createpost',verifyAuthToken,multipleUpload,createPost);
router.get('/signature',verifyAuthToken,generateSignature);
router.post('/likepost',verifyAuthToken,likeAndUnlikePost);
router.post('/addcomment',verifyAuthToken,addComment);
router.post('/deletecomment',verifyAuthToken,deleteComment);
router.get('/:_id',optionalAuthToken,getPost)
module.exports = router;
