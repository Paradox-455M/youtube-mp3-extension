const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const config = require('./config');
const { findFFmpeg, verifyFFmpeg } = require('./utils/ffmpegFinder');
const { cleanupOldFiles } = require('./utils/fileCleanup');
const { logger, loggerMiddleware } = require('./utils/logger');
const { errorHandler } = require('./utils/errors');

// Import routes
const conversionRoutes = require('./routes/conversionRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Verify FFmpeg installation
if (!verifyFFmpeg()) {
    logger.error('FFmpeg not found! Please install FFmpeg and ensure it\'s in your PATH or set FFMPEG_PATH environment variable.');
    logger.error('Installation guides:');
    logger.error('  - macOS: brew install ffmpeg');
    logger.error('  - Linux: sudo apt-get install ffmpeg (or your package manager)');
    logger.error('  - Windows: Download from https://ffmpeg.org/download.html');
    process.exit(1);
}

const ffmpegPath = findFFmpeg();
logger.info('FFmpeg found', { path: ffmpegPath });

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all chrome-extension origins
        if (origin.startsWith('chrome-extension://')) {
            return callback(null, true);
        }
        
        // Allow localhost for development
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        
        const allowedOrigins = config.ALLOWED_ORIGINS;
        if (allowedOrigins.includes(origin) || 
            process.env.ALLOWED_ORIGINS?.split(',').includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(loggerMiddleware);

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
fs.mkdir(tempDir, { recursive: true })
    .then(async () => {
        logger.info('Temp directory created/verified', { path: tempDir });
        // Clean up old files on startup
        const deletedCount = await cleanupOldFiles(tempDir);
        if (deletedCount > 0) {
            logger.info('Cleaned up old files on startup', { count: deletedCount });
        }
    })
    .catch(err => logger.error('Error creating temp directory', { error: err.message }));

// Schedule periodic cleanup (every hour)
setInterval(async () => {
    const deletedCount = await cleanupOldFiles(tempDir);
    if (deletedCount > 0) {
        logger.info('Periodic cleanup completed', { count: deletedCount });
    }
}, config.FILE_CLEANUP_TIME);

// Routes
app.use('/', conversionRoutes);
app.use('/', healthRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    logger.info('Server started', {
        port: PORT,
        tempDir,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { 
        reason: reason?.message || reason,
        stack: reason?.stack 
    });
});
