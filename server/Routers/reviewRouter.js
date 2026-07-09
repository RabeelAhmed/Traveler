const express = require('express');
const router = express.Router();
const { verifyAuthToken } = require('../Middleware/jwtAuthMiddleware');
const {
  createOrUpdateReview,
  getReviewsForLocation,
  getMyReview,
  deleteReview,
  markHelpful
} = require('../Controllers/reviewController');

// IMPORTANT: named/static routes must come before /:id routes
router.post('/', verifyAuthToken, createOrUpdateReview);
router.get('/location', verifyAuthToken, getReviewsForLocation);
router.get('/mine', verifyAuthToken, getMyReview);
router.delete('/:id', verifyAuthToken, deleteReview);
router.post('/:id/helpful', verifyAuthToken, markHelpful);

module.exports = router;
