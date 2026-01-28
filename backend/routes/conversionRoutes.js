const express = require('express');
const router = express.Router();
const {
    startConversion,
    getConversionStatus,
    downloadFile
} = require('../controllers/conversionController');
const {
    conversionRateLimiter,
    downloadRateLimiter
} = require('../middleware/rateLimiter');

// Apply rate limiting
router.post('/convert', conversionRateLimiter, startConversion);
router.get('/status/:conversionId', getConversionStatus);
router.get('/download/:filename', downloadRateLimiter, downloadFile);

module.exports = router;
