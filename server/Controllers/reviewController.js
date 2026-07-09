const Review = require('../Models/review');
const { success, error } = require('../Utils/responseWrapper');

// POST /review
// Create or update (upsert) the current user's review for a location
const createOrUpdateReview = async (req, res) => {
  try {
    const { location, rating, title, body, visitedAt } = req.body;
    const curUserId = req.user.user_Id;

    if (!location || !rating || !title || !body || !visitedAt) {
      return res.send(error(400, 'location, rating, title, body, and visitedAt are required'));
    }

    const existing = await Review.findOne({ author: curUserId, location });

    const review = await Review.findOneAndUpdate(
      { author: curUserId, location },
      { rating, title, body, visitedAt: new Date(visitedAt) },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    await review.populate('author', 'fullname profilePicture username');

    const statusCode = existing ? 200 : 201;
    return res.send(success(statusCode, { review }));
  } catch (err) {
    console.error('createOrUpdateReview error:', err);
    if (err.code === 11000) {
      return res.send(error(409, 'You already reviewed this location'));
    }
    return res.send(error(500, 'Something went wrong'));
  }
};

// GET /review/location?location=...
// Get all reviews for a location, plus aggregate summary
const getReviewsForLocation = async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.send(error(400, 'location query parameter is required'));
    }

    const [reviews, aggregation] = await Promise.all([
      Review.find({ location })
        .populate('author', 'fullname profilePicture username')
        .sort({ createdAt: -1 }),
      Review.aggregate([
        { $match: { location } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            total: { $sum: 1 },
            breakdown: { $push: '$rating' }
          }
        }
      ])
    ]);

    let summary = {
      avgRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (aggregation.length > 0) {
      const agg = aggregation[0];
      const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      agg.breakdown.forEach((r) => {
        if (breakdown[r] !== undefined) breakdown[r]++;
      });
      summary = {
        avgRating: Math.round(agg.avgRating * 10) / 10,
        totalReviews: agg.total,
        ratingBreakdown: breakdown
      };
    }

    return res.send(success(200, { reviews, summary }));
  } catch (err) {
    console.error('getReviewsForLocation error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

// GET /review/mine?location=...
// Get the current user's review for a specific location
const getMyReview = async (req, res) => {
  try {
    const { location } = req.query;
    const curUserId = req.user.user_Id;

    if (!location) {
      return res.send(error(400, 'location query parameter is required'));
    }

    const review = await Review.findOne({ author: curUserId, location })
      .populate('author', 'fullname profilePicture username');

    return res.send(success(200, { review: review || null }));
  } catch (err) {
    console.error('getMyReview error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

// DELETE /review/:id
// Delete a review — author only
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const curUserId = req.user.user_Id;

    const review = await Review.findById(id);
    if (!review) {
      return res.send(error(404, 'Review not found'));
    }

    if (review.author.toString() !== curUserId) {
      return res.status(403).send(error(403, 'Forbidden — you can only delete your own reviews'));
    }

    await review.deleteOne();
    return res.send(success(200, { message: 'Review deleted successfully' }));
  } catch (err) {
    console.error('deleteReview error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

// POST /review/:id/helpful
// Toggle the current user in the review's helpful array
const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const curUserId = req.user.user_Id;

    const review = await Review.findById(id);
    if (!review) {
      return res.send(error(404, 'Review not found'));
    }

    const alreadyHelpful = review.helpful.some(
      (uid) => uid.toString() === curUserId
    );

    if (alreadyHelpful) {
      review.helpful.pull(curUserId);
    } else {
      review.helpful.push(curUserId);
    }

    await review.save();

    return res.send(
      success(200, {
        isHelpful: !alreadyHelpful,
        helpfulCount: review.helpful.length
      })
    );
  } catch (err) {
    console.error('markHelpful error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

module.exports = {
  createOrUpdateReview,
  getReviewsForLocation,
  getMyReview,
  deleteReview,
  markHelpful
};
