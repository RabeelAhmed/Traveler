/**
 * server/Utils/redis.js
 *
 * Singleton Upstash Redis client.
 * Uses @upstash/redis (HTTP REST) — compatible with Vercel serverless.
 *
 * Supports two env var naming conventions:
 *   1. Vercel KV integration:  KV_REST_API_URL + KV_REST_API_TOKEN
 *   2. Manual Upstash setup:   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *
 * Falls back gracefully (cache disabled) if neither set is present.
 */

const { Redis } = require('@upstash/redis');

let redis = null;

// Resolve URL — prefer Vercel KV naming, fall back to manual naming
const redisUrl   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN  || process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
  redis = new Redis({
    url:   redisUrl,
    token: redisToken,
  });
  console.log('✓ Redis (Upstash) Configured —', redisUrl);
} else {
  console.warn(
    '[Redis] No Upstash credentials found (KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN). Cache disabled — falling back to MongoDB only.'
  );
}

module.exports = redis;
