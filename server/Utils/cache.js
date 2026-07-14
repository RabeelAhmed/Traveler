/**
 * server/Utils/cache.js
 *
 * Reusable Cache-Aside helpers using Upstash Redis.
 * All functions are safe — if Redis is unavailable they silently fall through.
 *
 * Exported helpers:
 *   getCache(key)                        → returns parsed value or null
 *   setCache(key, data, ttl)             → stores JSON-serialised data with TTL in seconds
 *   deleteCache(key)                     → removes one key
 *   deleteByPattern(pattern)             → scans and removes keys matching a pattern
 *   remember(key, ttl, callback)         → cache-aside: check → return | execute → store → return
 */

const redis = require('./redis');

const IS_DEV = process.env.NODE_ENV !== 'production';

// ─── Internal log (dev-only detail, prod-only warnings) ───────────────────────
const log = {
  hit:    (key) => IS_DEV && console.log(`[Cache HIT]  ${key}`),
  miss:   (key) => IS_DEV && console.log(`[Cache MISS] ${key}`),
  set:    (key, ttl) => IS_DEV && console.log(`[Cache SET]  ${key} (TTL=${ttl}s)`),
  del:    (key) => IS_DEV && console.log(`[Cache DEL]  ${key}`),
  warn:   (msg) => console.warn(`[Redis] ${msg}`),
};

// ─── getCache ─────────────────────────────────────────────────────────────────
const getCache = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    if (data !== null && data !== undefined) {
      log.hit(key);
      // Upstash already deserialises JSON; return as-is
      return data;
    }
    log.miss(key);
    return null;
  } catch (err) {
    log.warn(`getCache error for key "${key}": ${err.message}`);
    return null;
  }
};

// ─── setCache ─────────────────────────────────────────────────────────────────
const setCache = async (key, data, ttl = 300) => {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(data), { ex: ttl });
    log.set(key, ttl);
  } catch (err) {
    log.warn(`setCache error for key "${key}": ${err.message}`);
  }
};

// ─── deleteCache ──────────────────────────────────────────────────────────────
const deleteCache = async (key) => {
  if (!redis) return;
  try {
    await redis.del(key);
    log.del(key);
  } catch (err) {
    log.warn(`deleteCache error for key "${key}": ${err.message}`);
  }
};

// ─── deleteByPattern ──────────────────────────────────────────────────────────
// Uses SCAN to find all keys matching a glob pattern and DELetes them.
// Pattern examples: "feed:*", "post:*"
const deleteByPattern = async (pattern) => {
  if (!redis) return;
  try {
    let cursor = 0;
    const keysToDelete = [];
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = Number(nextCursor);
      keysToDelete.push(...keys);
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map((k) => redis.del(k)));
      IS_DEV && console.log(`[Cache DEL pattern] ${pattern} → removed ${keysToDelete.length} key(s)`);
    }
  } catch (err) {
    log.warn(`deleteByPattern error for pattern "${pattern}": ${err.message}`);
  }
};

// ─── remember ─────────────────────────────────────────────────────────────────
// Cache-aside helper:
//   1. Check Redis for key
//   2. If found → return cached value
//   3. Otherwise → execute callback(), store in Redis, return result
const remember = async (key, ttl, callback) => {
  const cached = await getCache(key);
  if (cached !== null) return cached;

  const result = await callback();

  // Only cache non-null/undefined results
  if (result !== null && result !== undefined) {
    await setCache(key, result, ttl);
  }

  return result;
};

// ─── TTL Constants ────────────────────────────────────────────────────────────
const TTL = {
  FEED:         300,   // 5 minutes
  POST:         600,   // 10 minutes
  PROFILE:      600,   // 10 minutes
  STORIES:      120,   // 2 minutes
  COLLECTIONS:  600,   // 10 minutes
  SEARCH:       300,   // 5 minutes
  TRENDING:     300,   // 5 minutes
};

module.exports = { getCache, setCache, deleteCache, deleteByPattern, remember, TTL };
