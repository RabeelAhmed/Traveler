const router = require('express').Router()
for (const param of ['id', '_id', 'userId', 'postId', 'conversationId']) router.param(param, require('../Middleware/validateId'));
const {signup,login,getProfile,updateProfile,generateProfilePicSignature,forgotPassword,resetPassword,uploadProfilePicController} = require('../Controllers/authenticationController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { upload, singleUpload, profileUpload } = require('../Middleware/uploads');
const { loginLimiter, forgotPasswordLimiter, resetPasswordLimiter, createRateLimiter } = require('../Middleware/rateLimiter');

router.post('/signup',createRateLimiter('rl:signup', 5, 900),signup);
router.get('/signature',verifyAuthToken,generateProfilePicSignature);
router.post('/login', loginLimiter, login);
router.post('/updateprofile',verifyAuthToken,profileUpload.single('profilePicture'),updateProfile);
router.post('/upload-profile-pic', createRateLimiter('rl:profile-upload', 5, 900), profileUpload.single('file'), uploadProfilePicController);
router.get('/profile',verifyAuthToken,getProfile);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.post('/forget-pasword', forgotPasswordLimiter, forgotPassword);
module.exports = router;