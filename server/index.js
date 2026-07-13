/**
 * index.js — Local Development Entry Point
 *
 * This file is used ONLY when running the server locally (node index.js / npm start).
 * Vercel uses api/index.js instead and never executes this file.
 *
 * Responsibilities:
 *  - Import the pure Express app from app.js
 *  - Wrap it in an HTTP server
 *  - Initialise Socket.IO (not available on Vercel)
 *  - Start listening on PORT
 *  - Handle graceful shutdown (SIGINT / SIGTERM)
 */

const { app, checkOrigin } = require('./app');
const http     = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { initsocket } = require('./socket');

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping the Express app
const server = http.createServer(app);

// Initialise Socket.IO with the same CORS policy as the REST API
const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    credentials: true,
  },
});
initsocket(io);

// ── Graceful Shutdown ──
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

process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ── Start Server ──
server.listen(PORT, () => {
  console.log('✓ Server Running');
  console.log(`Example app listening on port ${PORT}`);
});

