const router = require('express').Router()
const {createPost,getPost, generateSignature} = require('../Controllers/postController')
const {verifyAuthToken, optionalAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { multipleUpload } = require('../Middleware/uploads');

router.post('/createpost',verifyAuthToken,multipleUpload,createPost);
router.get('/signature',verifyAuthToken,generateSignature);
router.get('/:_id',optionalAuthToken,getPost)
module.exports = router;
