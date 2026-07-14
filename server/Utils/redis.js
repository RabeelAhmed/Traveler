/**
 * server/Utils/redis.js
 *
 * Singleton Upstash Redis client.
 * Uses @upstash/redis (HTTP REST) — compatible with Vercel serverless.
 * Falls back gracefully if env vars are missing.
 */

const { Redis } = require('@upstash/redis');

let redis = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('✓ Redis (Upstash) Configured');
} else {
  console.warn(
    '[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — cache disabled, falling back to MongoDB only.'
  );
}

module.exports = redis;
