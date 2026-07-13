// Ensure DNS resolution defaults to public DNS servers and IPv4 first
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('Warning: Could not set public DNS servers, using default OS resolution:', err.message);
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config();

// ── Environment Validation ──
const requiredEnvVars = [
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RESEND_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (!process.env.MONGO_URI && !process.env.URI) {
  missingEnvVars.push('MONGO_URI or URI');
}

if (missingEnvVars.length > 0) {
  console.error('Fatal Startup Error: Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

console.log('✓ Environment Loaded');
console.log('✓ Cloudinary Configured');
console.log('✓ Resend Configured');

const express    = require('express');
const helmet     = require('helmet');
const compression = require('compression');
const morgan     = require('morgan');
const cors       = require('cors');

// Initialise DB + cron jobs on first require
require('./db');
require('./Utils/cronJobs');

const app = express();

// ── CORS ──
const origin_env = process.env.ORIGIN;

const allowedOrigins = [
  origin_env,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

const checkOrigin = (origin, callback) => {
  if (
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  ) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

// ── Middlewares ──
app.use(helmet());
app.use(compression());
app.use(cors({ credentials: true, origin: checkOrigin }));

const morganFormat = process.env.NODE_ENV === 'production' ? 'tiny' : 'common';
app.use(morgan(morganFormat));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Routes ──
app.use('/auth',       require('./Routers/authenticationRouters'));
app.use('/story',      require('./Routers/storyRouter'));
app.use('/post',       require('./Routers/postRouter'));
app.use('/user',       require('./Routers/userRouter'));
app.use('/journey',    require('./Routers/journeyRouter'));
app.use('/bookmark',   require('./Routers/bookmarkRouter'));
app.use('/collection', require('./Routers/collectionRouter'));
app.use('/message',    require('./Routers/messageRouter'));
app.use('/review',     require('./Routers/reviewRouter'));
app.use('/live',       require('./Routers/liveRouter'));

// ── Health Check ──
app.get('/health', (req, res) => {
  res.status(200).json({
    status:    'ok',
    service:   'Traveler API',
    version:   '1.0.0',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Socket.IO (local dev only) ──
// Vercel functions are stateless — Socket.IO cannot maintain persistent
// WebSocket connections in a serverless environment. When the VERCEL
// environment variable is present we skip socket initialisation entirely
// and keep all REST endpoints fully functional.
if (process.env.VERCEL) {
  console.warn(
    '[Socket.IO] Disabled on Vercel — serverless functions are stateless. ' +
    'All REST API routes remain operational.'
  );
} else {
  // Socket.IO is initialised in index.js (local dev) after the HTTP server
  // is created. Nothing to do here.
}

// Export the pure Express app — no app.listen() here.
// Local dev (index.js) and Vercel (api/index.js) both import this.
module.exports = { app, checkOrigin };
