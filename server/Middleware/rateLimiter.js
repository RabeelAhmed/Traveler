/**
 * server/Middleware/rateLimiter.js
 *
 * Redis-backed rate limiter using Upstash Redis.
 * Returns HTTP 429 when the limit is exceeded.
 * Uses a bounded local limiter when Redis is not configured. Redis errors return 503.
 *
 * Usage:
 *   const { createRateLimiter } = require('../Middleware/rateLimiter');
 *
 *   // 5 requests per 5 minutes (300s)
 *   const loginLimiter = createRateLimiter('rl:login', 5, 300);
 *   router.post('/login', loginLimiter, login);
 */

const localWindows = new Map();
const redis = require('../Utils/redis');

/**
 * Factory that creates an Express middleware rate limiter.
 *
 * @param {string} prefix       - Cache key prefix, e.g. 'rl:login'
 * @param {number} limit        - Max requests allowed in the window
 * @param {number} windowSecs   - Window duration in seconds
 */
const createRateLimiter = (prefix, limit, windowSecs) => {
  return async (req, res, next) => {
    // Local fallback is used only when Redis has not been configured.


    // Use IP address as the identifier (works behind Vercel edge proxies)
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';

    const key = `${prefix}:${ip}`;

    try {
      // Increment the counter
      let current;
      let remainingSecs = windowSecs;
      if (redis) {
        const result = await redis.eval("local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return {n, redis.call('TTL', KEYS[1])}", [key], [windowSecs]);
        current = Number(result[0]); remainingSecs = Number(result[1]);
      } else {
        const now = Date.now();
        for (const [id, value] of localWindows) if (value.expires <= now) localWindows.delete(id);
        if (localWindows.size >= 10000 && !localWindows.has(key)) return res.status(503).json({ message: 'Please try again later' });
        const bucket = localWindows.get(key) || { count: 0, expires: now + windowSecs * 1000 };
        current = ++bucket.count; remainingSecs = Math.ceil((bucket.expires - now) / 1000);
        localWindows.set(key, bucket);
      }

      // On first request, set the expiry


      // Add rate limit headers
      res.set('X-RateLimit-Limit', limit);
      res.set('X-RateLimit-Remaining', Math.max(0, limit - current));

      if (current > limit) {
        const ttl = remainingSecs;
        res.set('Retry-After', ttl > 0 ? ttl : windowSecs);
        return res.status(429).json({
          success: false,
          status: 'error',
          message: `Too many requests. Please try again in ${Math.ceil((ttl > 0 ? ttl : windowSecs) / 60)} minute(s).`,
        });
      }

      next();
    } catch (err) {
      // Redis errors fail closed so authentication limits cannot be bypassed.
      console.warn(`[RateLimit] Redis error for key "${key}": ${err.message}. Blocking request.`);
      return res.status(503).json({ message: 'Rate limiting temporarily unavailable. Please try again later.' });
    }
  };
};

// ─── Pre-built limiters ───────────────────────────────────────────────────────

/** 5 attempts per 5 minutes */
const loginLimiter = createRateLimiter('rl:login', 5, 300);

/** 3 attempts per 15 minutes */
const forgotPasswordLimiter = createRateLimiter('rl:forgot', 3, 900);

/** 3 attempts per 15 minutes */
const resetPasswordLimiter = createRateLimiter('rl:reset', 3, 900);

/** 20 posts per hour */
const createPostLimiter = createRateLimiter('rl:createpost', 20, 3600);

module.exports = {
  createRateLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  createPostLimiter,
};
