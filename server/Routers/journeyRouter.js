const router = require('express').Router()
const {createJourney, addStepToJourney} = require('../Controllers/journeyController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const {multipleUpload} = require('../Middleware/uploads')

router.post('/createjourney',verifyAuthToken,createJourney);
router.post('/addsteptojourney',verifyAuthToken,multipleUpload,addStepToJourney);
module.exports = router;
