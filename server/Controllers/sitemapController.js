const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");
const Post = require("../Models/post");
const Journey = require("../Models/journey");
const User = require("../Models/User");
const Destination = require("../Models/destination");
const Review = require("../Models/review");
const { remember } = require("../Utils/cache");

const getSitemap = async (req, res) => {
  try {
    // Cache sitemap XML for 1 hour
    const xml = await remember("sitemap:xml", 3600, async () => {
      const [posts, journeys, users, destinations, distinctLocations] = await Promise.all([
        Post.find({}, "slug postingDate").lean(),
        Journey.find({}, "slug startedAt").lean(),
        User.find({}, "slug createdAt").lean(),
        Destination.find({}, "slug").lean(),
        Review.distinct("location")
      ]);

      const sitemapStream = new SitemapStream({
        hostname: "https://traveler-social.netlify.app"
      });

      const links = [
        { url: "/", changefreq: "daily", priority: 1.0 },
        { url: "/destinations", changefreq: "daily", priority: 0.9 },
        { url: "/travel-guides", changefreq: "weekly", priority: 0.8 },
        { url: "/travel-tips", changefreq: "weekly", priority: 0.8 },
        { url: "/top-rated-destinations", changefreq: "daily", priority: 0.8 },
        { url: "/hidden-gems-pakistan", changefreq: "weekly", priority: 0.8 },
        { url: "/traveladvisor", changefreq: "weekly", priority: 0.7 },
        { url: "/trending", changefreq: "daily", priority: 0.7 }
      ];

      // Add slug-based posts
      posts.forEach((post) => {
        const identifier = post.slug || post._id;
        if (identifier) {
          links.push({
            url: `/post/${identifier}`,
            changefreq: "weekly",
            priority: 0.6,
            lastmod: post.postingDate ? new Date(post.postingDate).toISOString() : new Date().toISOString()
          });
        }
      });

      // Add slug-based journeys
      journeys.forEach((journey) => {
        const identifier = journey.slug || journey._id;
        if (identifier) {
          links.push({
            url: `/journey/${identifier}`,
            changefreq: "weekly",
            priority: 0.6,
            lastmod: journey.startedAt ? new Date(journey.startedAt).toISOString() : new Date().toISOString()
          });
        }
      });

      // Add slug-based user profiles
      users.forEach((user) => {
        const identifier = user.slug || user._id;
        if (identifier) {
          links.push({
            url: `/profile/${identifier}`,
            changefreq: "weekly",
            priority: 0.5,
            lastmod: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
          });
        }
      });

      // Add all 69 destination programmatic pages
      destinations.forEach((dest) => {
        if (dest.slug) {
          links.push({
            url: `/destinations/${dest.slug}`,
            changefreq: "weekly",
            priority: 0.7
          });
        }
      });

      // Add review location pages (legacy matching)
      distinctLocations.forEach((location) => {
        if (location) {
          links.push({
            url: `/reviews?location=${encodeURIComponent(location)}`,
            changefreq: "weekly",
            priority: 0.6
          });
        }
      });

      const xmlBuffer = await streamToPromise(Readable.from(links).pipe(sitemapStream));
      return xmlBuffer.toString();
    });

    res.header("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Error generating sitemap:", err);
    res.status(500).end();
  }
};

module.exports = { getSitemap };
