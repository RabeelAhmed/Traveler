const router = require('express').Router()
const {signup,login,getProfile,updateProfile,generateProfilePicSignature,forgotPassword,resetPassword,uploadProfilePicController} = require('../Controllers/authenticationController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { upload, singleUpload } = require('../Middleware/uploads');
const { loginLimiter, forgotPasswordLimiter, resetPasswordLimiter } = require('../Middleware/rateLimiter');

router.post('/signup',signup);
router.get('/signature',generateProfilePicSignature);
router.post('/login', loginLimiter, login);
router.post('/updateprofile',verifyAuthToken,singleUpload,updateProfile);
router.post('/upload-profile-pic', upload.single('file'), uploadProfilePicController);
router.get('/profile',verifyAuthToken,getProfile);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.post('/forget-pasword', forgotPasswordLimiter, forgotPassword);
module.exports = router;