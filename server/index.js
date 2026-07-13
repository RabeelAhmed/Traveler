// Ensure DNS resolution defaults to public DNS servers and IPv4 first to prevent querySrv ECONNREFUSED with MongoDB Atlas
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
  'MONGO_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RESEND_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Fatal Startup Error: Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

console.log('✓ Environment Loaded');
console.log('✓ Cloudinary Configured');
console.log('✓ Resend Configured');

const express = require('express');
const dbconnection = require('./db');
const http = require('http'); // Required for socket.io
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const authentication = require('./Routers/authenticationRouters');
const morgan = require('morgan');
const cors = require('cors');

dbconnection;
require('./Utils/cronJobs');

const app = express();
const PORT = process.env.PORT || 5000;
const origin_env = process.env.ORIGIN;

// Define allowed origins dynamically (keep localhost working)
const allowedOrigins = [
  origin_env,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

const checkOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    credentials: true,
  },
});

const story = require('./Routers/storyRouter');
const postRouter = require('./Routers/postRouter');
const userRouter = require('./Routers/userRouter');
const journeyRouter = require('./Routers/journeyRouter');
const bookmarkRouter = require('./Routers/bookmarkRouter');
const collectionRouter = require('./Routers/collectionRouter');
const messageRouter = require('./Routers/messageRouter');
const reviewRouter = require('./Routers/reviewRouter');
const liveRouter = require('./Routers/liveRouter');
const { initsocket } = require('./socket');
initsocket(io);

// Middlewares
app.use(helmet());
app.use(compression());

app.use(cors({ 
  credentials: true,
  origin: checkOrigin,
}));

const morganFormat = process.env.NODE_ENV === 'production' ? 'tiny' : 'common';
app.use(morgan(morganFormat));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/auth', authentication);
app.use('/story', story);
app.use('/post', postRouter);
app.use('/user', userRouter);
app.use('/journey', journeyRouter);
app.use('/bookmark', bookmarkRouter);
app.use('/collection', collectionRouter);
app.use('/message', messageRouter);
app.use('/review', reviewRouter);
app.use('/live', liveRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Traveler API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during MongoDB connection shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

server.listen(PORT, () => {
  console.log(`✓ Server Running`);
  console.log(`Example app listening on port ${PORT}`);
});

