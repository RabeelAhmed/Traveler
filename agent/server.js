const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

const allowedOrigins = [
  'https://traveler-social.netlify.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || 
        /^https:\/\/[a-zA-Z0-9-_\.]+\.netlify\.app$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

const CSV_PATH = path.join(__dirname, 'Tourist Destinations.csv');

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const headers = ['_key', 'Desc', 'category', 'district', 'latitude', 'longitude'];
  
  const records = [];
  let currentRecord = null;
  let currentField = '';
  let inQuotes = false;
  let fieldIndex = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (!currentRecord) {
      currentRecord = {};
      fieldIndex = 0;
      currentField = '';
    }

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRecord[headers[fieldIndex]] = currentField.trim();
      currentField = '';
      fieldIndex++;
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRecord[headers[fieldIndex]] = currentField.trim();
      if (currentRecord._key && currentRecord._key !== '_key') {
        currentRecord.latitude = parseFloat(currentRecord.latitude) || 0;
        currentRecord.longitude = parseFloat(currentRecord.longitude) || 0;
        records.push(currentRecord);
      }
      currentRecord = null;
    } else {
      currentField += char;
    }
  }
  
  if (currentRecord) {
    currentRecord[headers[fieldIndex]] = currentField.trim();
    if (currentRecord._key && currentRecord._key !== '_key') {
      currentRecord.latitude = parseFloat(currentRecord.latitude) || 0;
      currentRecord.longitude = parseFloat(currentRecord.longitude) || 0;
      records.push(currentRecord);
    }
  }
  
  return records;
}

// Load data once at startup
let destinations = [];
try {
  destinations = parseCSV(CSV_PATH);
  console.log(`Loaded ${destinations.length} destinations successfully.`);
} catch (err) {
  console.error('Failed to load CSV:', err);
}

// Helper to get unique values for validation
const districtsSet = new Set(destinations.map(d => d.district.toLowerCase()));
const categoriesSet = new Set(destinations.map(d => d.category.toLowerCase()));

app.get('/recommend', (req, res) => {
  const district = req.query.district;
  const category = req.query.category;

  if (district && !districtsSet.has(district.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid district' });
  }
  if (category && !categoriesSet.has(category.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  let filtered = destinations;
  if (category) {
    filtered = filtered.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }
  if (district) {
    filtered = filtered.filter(d => d.district.toLowerCase() === district.toLowerCase());
  }

  if (filtered.length === 0) {
    return res.status(404).json({ message: 'No recommendations found' });
  }

  // If both category and district are specified, return up to 5 recommendations
  if (category && district) {
    return res.json(filtered.slice(0, 5));
  }

  return res.json(filtered);
});

app.get('/recommend/geo', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid or missing latitude/longitude' });
  }

  let minDist = Infinity;
  let nearest = null;

  for (const d of destinations) {
    const dist = Math.pow(d.latitude - lat, 2) + Math.pow(d.longitude - lon, 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = d;
    }
  }

  if (!nearest) {
    return res.status(404).json({ error: 'No destinations found' });
  }

  return res.json(nearest);
});

const port = process.env.PORT || 5001;
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Travel Advisor Mock Engine listening on port ${port}`);
  });
}

module.exports = app;
