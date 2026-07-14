/**
 * server/Middleware/rateLimiter.js
 *
 * Redis-backed rate limiter using Upstash Redis.
 * Returns HTTP 429 when the limit is exceeded.
 * Gracefully passes requests through if Redis is unavailable.
 *
 * Usage:
 *   const { createRateLimiter } = require('../Middleware/rateLimiter');
 *
 *   // 5 requests per 5 minutes (300s)
 *   const loginLimiter = createRateLimiter('rl:login', 5, 300);
 *   router.post('/login', loginLimiter, login);
 */

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
    // If Redis is not configured, skip rate limiting gracefully
    if (!redis) return next();

    // Use IP address as the identifier (works behind Vercel edge proxies)
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const key = `${prefix}:${ip}`;

    try {
      // Increment the counter
      const current = await redis.incr(key);

      // On first request, set the expiry
      if (current === 1) {
        await redis.expire(key, windowSecs);
      }

      // Add rate limit headers
      res.set('X-RateLimit-Limit', limit);
      res.set('X-RateLimit-Remaining', Math.max(0, limit - current));

      if (current > limit) {
        const ttl = await redis.ttl(key);
        res.set('Retry-After', ttl > 0 ? ttl : windowSecs);
        return res.status(429).json({
          success: false,
          status: 'error',
          message: `Too many requests. Please try again in ${Math.ceil((ttl > 0 ? ttl : windowSecs) / 60)} minute(s).`,
        });
      }

      next();
    } catch (err) {
      // Redis error — fail open (allow the request) and log a warning
      console.warn(`[RateLimit] Redis error for key "${key}": ${err.message}. Allowing request.`);
      next();
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
