const router = require('express').Router()
const {signup,login,generateProfilePicSignature,forgotPassword,resetPassword} = require('../Controllers/authenticationController')

router.post('/signup',signup);
router.get('/signature',generateProfilePicSignature);
router.post('/login',login);
router.post('/reset-password',resetPassword);
router.post('/forget-pasword',forgotPassword);
module.exports = router;
