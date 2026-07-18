const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Destination = require("../Models/destination");
const User = require("../Models/User");
const Post = require("../Models/post");
const Journey = require("../Models/journey");

// Helper function to slugify text
const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")           // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start
    .replace(/-+$/, "");            // Trim - from end
};

// Custom robust CSV parser to handle quotes and newlines
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Skip double double-quotes
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(cell.trim());
        cell = "";
      } else if (char === "\r" || char === "\n") {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
        row.push(cell.trim());
        if (row.length > 1 || row[0] !== "") {
          rows.push(row);
        }
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}

const runMigration = async () => {
  try {
    console.log("Starting DB Migration and Data Seeding...");

    // 1. Seed Destinations if empty
    const destinationCount = await Destination.countDocuments();
    if (destinationCount === 0) {
      console.log("No destinations found. Seeding from Tourist Destinations.csv...");
      const csvPath = path.join(__dirname, "../../agent/Tourist Destinations.csv");
      if (fs.existsSync(csvPath)) {
        const rows = parseCSV(csvPath);
        // Skip header row
        const dataRows = rows.slice(1);

        const destinationsToInsert = [];
        for (const row of dataRows) {
          if (row.length < 6) continue;
          const [name, desc, category, district, lat, lng] = row;
          if (!name) continue;

          destinationsToInsert.push({
            name: name,
            slug: slugify(name),
            description: desc || "",
            category: category || "",
            district: district || "",
            location: {
              latitude: parseFloat(lat) || 0,
              longitude: parseFloat(lng) || 0,
            },
            faq: [
              {
                question: `What is the best time to visit ${name}?`,
                answer: `The best time to visit ${name} in ${district || "Pakistan"} is during the pleasant weather seasons, typically between May and October.`,
              },
              {
                question: `What category of tourist attraction is ${name}?`,
                answer: `${name} is classified as a ${category || "scenic"} spot in the ${district || "beautiful"} region.`,
              },
              {
                question: `Can I view community reviews and travel tips for ${name} on Traveler?`,
                answer: `Yes, you can read community-sourced reviews, view rating highlights, and explore related journeys for ${name} right here on Traveler.`,
              },
            ],
          });
        }

        if (destinationsToInsert.length > 0) {
          await Destination.insertMany(destinationsToInsert);
          console.log(`✓ Successfully seeded ${destinationsToInsert.length} destinations.`);
        }
      } else {
        console.warn(`Warning: Could not find destinations CSV file at: ${csvPath}`);
      }
    } else {
      console.log(`Destinations already seeded (${destinationCount} records present).`);
    }

    // 2. Migration: Backfill slugs for existing Users
    const usersWithoutSlugs = await User.find({
      $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }],
    });
    if (usersWithoutSlugs.length > 0) {
      console.log(`Generating slugs for ${usersWithoutSlugs.length} users...`);
      for (const u of usersWithoutSlugs) {
        let baseSlug = slugify(u.fullname || u.username || "user");
        let uniqueSlug = baseSlug;
        let count = 1;
        while (await User.findOne({ slug: uniqueSlug, _id: { $ne: u._id } })) {
          uniqueSlug = `${baseSlug}-${count}`;
          count++;
        }
        u.slug = uniqueSlug;
        await u.save();
      }
      console.log("✓ User slug migration complete.");
    }

    // 3. Migration: Backfill slugs for existing Posts
    const postsWithoutSlugs = await Post.find({
      $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }],
    });
    if (postsWithoutSlugs.length > 0) {
      console.log(`Generating slugs for ${postsWithoutSlugs.length} posts...`);
      for (const p of postsWithoutSlugs) {
        let baseSlug = slugify(p.title || "post");
        let uniqueSlug = baseSlug;
        let count = 1;
        while (await Post.findOne({ slug: uniqueSlug, _id: { $ne: p._id } })) {
          uniqueSlug = `${baseSlug}-${count}`;
          count++;
        }
        p.slug = uniqueSlug;
        await p.save();
      }
      console.log("✓ Post slug migration complete.");
    }

    // 4. Migration: Backfill slugs for existing Journeys
    const journeysWithoutSlugs = await Journey.find({
      $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }],
    });
    if (journeysWithoutSlugs.length > 0) {
      console.log(`Generating slugs for ${journeysWithoutSlugs.length} journeys...`);
      for (const j of journeysWithoutSlugs) {
        let baseSlug = slugify(j.title || "journey");
        let uniqueSlug = baseSlug;
        let count = 1;
        while (await Journey.findOne({ slug: uniqueSlug, _id: { $ne: j._id } })) {
          uniqueSlug = `${baseSlug}-${count}`;
          count++;
        }
        j.slug = uniqueSlug;
        await j.save();
      }
      console.log("✓ Journey slug migration complete.");
    }

    console.log("✓ DB Migration and Data Seeding completed successfully.");
  } catch (err) {
    console.error("Migration/Seeding Error:", err);
  }
};

module.exports = { runMigration, slugify };
