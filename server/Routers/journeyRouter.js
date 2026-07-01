const router = require('express').Router()
const {createJourney} = require('../Controllers/journeyController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')

router.post('/createjourney',verifyAuthToken,createJourney);
module.exports = router;
