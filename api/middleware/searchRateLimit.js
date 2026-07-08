const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Custom rate limiter using @upstash/redis
 * Max 30 requests per minute per IP
 */
const searchRateLimit = async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const key = `rate_limit:search:${ip}`;

    const currentRequests = await redis.incr(key);

    if (currentRequests === 1) {
      await redis.expire(key, 60); // Expire after 60 seconds
    }

    if (currentRequests > 30) {
      return res.status(429).json({
        message: 'Too many search requests, please try again later.',
        error: true,
      });
    }

    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    // If Redis fails, we should probably allow the request to pass to not block service
    next();
  }
};

module.exports = searchRateLimit;
