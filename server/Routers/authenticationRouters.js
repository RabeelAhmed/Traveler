const router = require('express').Router()
const {signup,login,generateProfilePicSignature} = require('../Controllers/authenticationController')

router.post('/signup',signup);
router.get('/signature',generateProfilePicSignature);
router.post('/login',login);
module.exports = router;
