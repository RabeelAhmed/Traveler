const express = require("express");
const router = express.Router();
const { getSitemap } = require("../Controllers/sitemapController");

router.get("/", getSitemap);

module.exports = router;
