const Destination = require("../Models/destination");
const Review = require("../Models/review");
const Post = require("../Models/post");
const Journey = require("../Models/journey");
const { success, error } = require("../Utils/responseWrapper");

// Haversine formula to compute distance in km
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper to get stats for all destinations dynamically
const getDestinationsStats = async () => {
  const destinations = await Destination.find().lean();
  const reviews = await Review.find().populate("author", "fullname username profilePicture").lean();

  return destinations.map((d) => {
    const dReviews = reviews.filter(
      (r) => r.location && r.location.toLowerCase() === d.name.toLowerCase()
    );
    const count = dReviews.length;
    const avgRating = count > 0 ? dReviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    const latestReviewDate =
      count > 0
        ? new Date(Math.max(...dReviews.map((r) => new Date(r.createdAt || 0))))
        : new Date(0);

    return {
      ...d,
      reviewCount: count,
      avgRating: parseFloat(avgRating.toFixed(1)),
      latestReviewDate,
      reviews: dReviews,
    };
  });
};

const getDestinations = async (req, res) => {
  try {
    const stats = await getDestinationsStats();
    // Sort destinations alphabetically
    stats.sort((a, b) => a.name.localeCompare(b.name));
    return res.status(200).send(success(200, { destinations: stats }));
  } catch (err) {
    console.error(err);
    return res.status(500).send(error(500, "Failed to retrieve destinations"));
  }
};

const getDestinationBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const destination = await Destination.findOne({ slug }).lean();

    if (!destination) {
      return res.status(404).send(error(404, "Destination not found"));
    }

    // 1. Fetch reviews
    const reviews = await Review.find({
      location: { $regex: new RegExp("^" + destination.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
    })
      .populate("author", "fullname username profilePicture")
      .lean();

    const avgRating =
      reviews.length > 0
        ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : 0;

    // 2. Fetch related posts
    const relatedPosts = await Post.find({
      location: { $regex: new RegExp("^" + destination.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
    })
      .populate("userId", "fullname username profilePicture")
      .lean();

    // 3. Fetch related journeys
    const postIds = relatedPosts.map((p) => p._id);
    const relatedJourneys = await Journey.find({
      steps: { $in: postIds },
    })
      .populate("owner", "fullname username profilePicture")
      .lean();

    // 4. Calculate Nearby destinations (top 5 closest)
    const allDestinations = await Destination.find({ _id: { $ne: destination._id } }).lean();
    const nearbyDestinations = allDestinations
      .map((d) => ({
        ...d,
        distance: getDistance(
          destination.location.latitude,
          destination.location.longitude,
          d.location.latitude,
          d.location.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    return res.status(200).send(
      success(200, {
        destination,
        avgRating,
        reviewCount: reviews.length,
        reviews,
        relatedPosts,
        relatedJourneys,
        nearbyDestinations,
      })
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send(error(500, "Failed to retrieve destination details"));
  }
};

const getCuratedDestinations = async (req, res) => {
  try {
    const { type } = req.params;
    const stats = await getDestinationsStats();

    let list = [];
    if (type === "top-rated") {
      list = stats
        .filter((d) => d.avgRating > 0)
        .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
        .slice(0, 10);
    } else if (type === "hidden-gems") {
      // High rating but low review counts (less discovered!)
      list = stats
        .filter((d) => d.avgRating >= 4.0 && d.reviewCount <= 2)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 10);
    } else if (type === "most-reviewed") {
      list = stats
        .filter((d) => d.reviewCount > 0)
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 10);
    } else if (type === "recently-reviewed") {
      list = stats
        .filter((d) => d.reviewCount > 0)
        .sort((a, b) => b.latestReviewDate - a.latestReviewDate)
        .slice(0, 10);
    } else {
      list = stats.slice(0, 10);
    }

    return res.status(200).send(success(200, { destinations: list }));
  } catch (err) {
    console.error(err);
    return res.status(500).send(error(500, "Failed to retrieve curated destinations"));
  }
};

module.exports = {
  getDestinations,
  getDestinationBySlug,
  getCuratedDestinations,
};
