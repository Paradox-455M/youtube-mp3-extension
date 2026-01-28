const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errors');

/**
 * Rate limiter for conversion endpoint
 */
const conversionRateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10, // 10 requests per window
    message: 'Too many conversion requests. Please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res, next) => {
        const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000);
        const error = new RateLimitError(retryAfter);
        next(error);
    }
});

/**
 * Rate limiter for download endpoint
 */
const downloadRateLimiter = rateLimit({
    windowMs: parseInt(process.env.DOWNLOAD_RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
    max: parseInt(process.env.DOWNLOAD_RATE_LIMIT_MAX_REQUESTS) || 20, // 20 requests per minute
    message: 'Too many download requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000);
        const error = new RateLimitError(retryAfter);
        next(error);
    }
});

module.exports = {
    conversionRateLimiter,
    downloadRateLimiter
};
