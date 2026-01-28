const express = require('express');
const router = express.Router();
const { findFFmpeg, verifyFFmpeg } = require('../utils/ffmpegFinder');

router.get('/health', (req, res) => {
    const ffmpegAvailable = verifyFFmpeg();
    const ffmpegPath = findFFmpeg();

    res.json({
        status: 'ok',
        ffmpeg: ffmpegAvailable ? 'available' : 'not found',
        ffmpegPath: ffmpegPath || 'not configured',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
