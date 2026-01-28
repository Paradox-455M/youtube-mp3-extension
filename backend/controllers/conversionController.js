const path = require('path');
const fs = require('fs').promises;
const { ValidationError, NotFoundError } = require('../utils/errors');
const { isValidYouTubeUrl, sanitizeFilename, isValidFileSize } = require('../utils/validators');
const { getVideoInfo, convertToMP3 } = require('../services/conversionService');
const config = require('../config');

// Store active conversions for progress tracking
const activeConversions = new Map();

/**
 * Start conversion
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware
 */
async function startConversion(req, res, next) {
    const { url, audioQuality, audioFormat } = req.body;
    const logger = req.logger;
    const tempDir = path.join(__dirname, '..', 'temp');

    try {
        // Validation
        if (!url) {
            throw new ValidationError('URL is required', 'url');
        }

        if (!isValidYouTubeUrl(url)) {
            throw new ValidationError('Invalid YouTube URL', 'url');
        }

        // Validate audio format
        const validFormats = ['mp3', 'm4a', 'opus', 'wav', 'flac'];
        const format = audioFormat && validFormats.includes(audioFormat.toLowerCase()) 
            ? audioFormat.toLowerCase() 
            : 'mp3';

        // Validate audio quality (0-9 for mp3, or bitrate like 128K, 192K, 256K, 320K)
        const quality = audioQuality || '0';

        // Get video info
        const info = await getVideoInfo(url, logger);
        const videoTitle = info.title || 'download';
        const safeTitle = sanitizeFilename(videoTitle);
        const fileExtension = format === 'mp3' ? 'mp3' : format;
        const fileName = `${safeTitle}-${Date.now()}.${fileExtension}`;
        const outputFile = path.join(tempDir, fileName);

        // Generate conversion ID
        const conversionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store conversion info
        activeConversions.set(conversionId, {
            url,
            fileName,
            outputFile,
            status: 'processing',
            progress: 0,
            startTime: Date.now(),
            title: videoTitle,
            audioFormat: format,
            audioQuality: quality
        });

        // Start conversion (non-blocking)
        convertToMP3(url, outputFile, logger, (progress) => {
            const conversion = activeConversions.get(conversionId);
            if (conversion) {
                conversion.progress = progress;
            }
        }, {
            audioFormat: format,
            audioQuality: quality
        })
        .then((result) => {
            const conversion = activeConversions.get(conversionId);
            if (conversion) {
                conversion.status = 'completed';
                conversion.result = result;
            }
        })
        .catch((error) => {
            const conversion = activeConversions.get(conversionId);
            if (conversion) {
                conversion.status = 'failed';
                conversion.error = error.message;
            }
            logger.error('Conversion failed', { conversionId, error: error.message });
        });

        // Return conversion ID immediately
        const port = process.env.PORT || 4000;
        res.json({
            success: true,
            conversionId,
            title: videoTitle,
            downloadUrl: `http://localhost:${port}/download/${fileName}`,
            statusUrl: `http://localhost:${port}/status/${conversionId}`
        });

    } catch (error) {
        next(error);
    }
}

/**
 * Get conversion status
 */
function getConversionStatus(req, res, next) {
    const { conversionId } = req.params;
    const conversion = activeConversions.get(conversionId);

    if (!conversion) {
        throw new NotFoundError('Conversion');
    }

    const response = {
        conversionId,
        status: conversion.status,
        progress: conversion.progress,
        fileName: conversion.fileName
    };

    if (conversion.status === 'completed') {
        response.downloadUrl = `http://localhost:${process.env.PORT || 4000}/download/${conversion.fileName}`;
    }

    if (conversion.status === 'failed') {
        response.error = conversion.error;
    }

    res.json(response);
}

/**
 * Download converted file
 */
async function downloadFile(req, res, next) {
    const filename = path.basename(req.params.filename);
    const tempDir = path.join(__dirname, '..', 'temp');
    const filePath = path.join(tempDir, filename);
    const logger = req.logger;

    try {
        await fs.access(filePath);
        const stats = await fs.stat(filePath);

        // Check file size limit
        if (!isValidFileSize(stats.size, config.MAX_FILE_SIZE)) {
            throw new ValidationError('File size exceeds maximum allowed size');
        }

        logger.info('Serving file download', {
            filename,
            size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', stats.size);

        const fsSync = require('fs');
        const fileStream = fsSync.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('end', () => {
            logger.info('File streamed successfully', { filename });
            // Delete file after successful download
            fs.unlink(filePath)
                .then(() => logger.info('Temp file deleted', { filename }))
                .catch(err => logger.error('Error deleting temp file', { filename, error: err.message }));
        });

        fileStream.on('error', (error) => {
            logger.error('Streaming error', { filename, error: error.message });
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error streaming file' });
            }
        });

    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new NotFoundError('File');
        }
        next(error);
    }
}

module.exports = {
    startConversion,
    getConversionStatus,
    downloadFile
};
