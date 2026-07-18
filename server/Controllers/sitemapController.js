const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");
const Post = require("../Models/post");
const Journey = require("../Models/journey");
const User = require("../Models/User");
const Review = require("../Models/review");
const { remember } = require("../Utils/cache");

const getSitemap = async (req, res) => {
  try {
    // Cache the XML string for 1 hour (3600 seconds)
    const xml = await remember("sitemap:xml", 3600, async () => {
      // 1. Fetch public content from DB in parallel
      const [posts, journeys, users, distinctLocations] = await Promise.all([
        Post.find({}, "_id postingDate").lean(),
        Journey.find({}, "_id startedAt").lean(),
        User.find({}, "_id createdAt").lean(),
        Review.distinct("location")
      ]);

      const sitemapStream = new SitemapStream({
        hostname: "https://traveler-social.netlify.app"
      });

      const links = [
        { url: "/", changefreq: "daily", priority: 1.0 },
        { url: "/traveladvisor", changefreq: "weekly", priority: 0.8 },
        { url: "/trending", changefreq: "daily", priority: 0.8 }
      ];

      // Add standalone posts (which are public content)
      posts.forEach((post) => {
        links.push({
          url: `/post/${post._id}`,
          changefreq: "weekly",
          priority: 0.6,
          lastmod: post.postingDate ? new Date(post.postingDate).toISOString() : new Date().toISOString()
        });
      });

      // Add public journeys
      journeys.forEach((journey) => {
        links.push({
          url: `/journey/${journey._id}`,
          changefreq: "weekly",
          priority: 0.6,
          lastmod: journey.startedAt ? new Date(journey.startedAt).toISOString() : new Date().toISOString()
        });
      });

      // Add user profiles
      users.forEach((user) => {
        links.push({
          url: `/profile/${user._id}`,
          changefreq: "weekly",
          priority: 0.5,
          lastmod: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
        });
      });

      // Add review destinations
      distinctLocations.forEach((location) => {
        if (location) {
          links.push({
            url: `/reviews?location=${encodeURIComponent(location)}`,
            changefreq: "weekly",
            priority: 0.7
          });
        }
      });

      // Generate the XML string
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
