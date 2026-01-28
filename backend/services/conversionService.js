const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const { findFFmpeg } = require('../utils/ffmpegFinder');
const { sanitizeFilename, isValidFileSize } = require('../utils/validators');
const { parseProgress, isComplete } = require('../utils/progressParser');
const { ConversionError, FileSizeError } = require('../utils/errors');
const { videoInfoCache } = require('../utils/cache');
const config = require('../config');

const ytDlp = new YTDlpWrap();
const FFMPEG_PATH = findFFmpeg();

/**
 * Get video information with caching
 * @param {string} url - YouTube URL
 * @param {object} logger - Winston logger instance
 * @returns {Promise<object>} Video information
 */
async function getVideoInfo(url, logger) {
    try {
        // Check cache first
        const cached = videoInfoCache.get(url);
        if (cached) {
            logger.debug('Video info retrieved from cache', { url });
            return cached;
        }

        logger.info('Fetching video info', { url });
        const info = await ytDlp.getVideoInfo(url);
        logger.info('Video info retrieved', {
            title: info.title,
            duration: info.duration,
            format: info.format
        });

        // Cache the result
        videoInfoCache.set(url, info);
        
        return info;
    } catch (error) {
        logger.error('Error fetching video info', { error: error.message, url });
        throw new ConversionError('Failed to fetch video information', error.message);
    }
}

/**
 * Convert YouTube video to MP3 with progress tracking
 * @param {string} url - YouTube URL
 * @param {string} outputFile - Output file path
 * @param {object} logger - Winston logger instance
 * @param {function} progressCallback - Callback for progress updates (progress: number)
 * @param {object} options - Conversion options (audioQuality, audioFormat)
 * @returns {Promise<object>} Conversion result
 */
function convertToMP3(url, outputFile, logger, progressCallback = null, options = {}) {
    return new Promise((resolve, reject) => {
        let lastProgress = 0;
        let errorBuffer = '';

        const audioFormat = options.audioFormat || 'mp3';
        const audioQuality = options.audioQuality || '0'; // 0 = best quality

        // Build yt-dlp command with options to bypass YouTube restrictions
        const ytDlpArgs = [
            '-x',
            '--audio-format', audioFormat,
            '--audio-quality', audioQuality,
            '-o', outputFile,
            '--no-keep-video',
            '--force-overwrites',
            '--no-playlist',
            '--progress',
            '--newline',
            // Options to bypass YouTube restrictions
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--extractor-args', 'youtube:player_client=android',
            '--no-warnings',
            url
        ];

        if (FFMPEG_PATH) {
            ytDlpArgs.splice(-1, 0, '--ffmpeg-location', FFMPEG_PATH);
        }

        logger.info('Starting conversion', { url, outputFile, audioFormat, audioQuality });
        const ytDlpProcess = spawn('yt-dlp', ytDlpArgs);

        ytDlpProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                // Parse progress
                const progress = parseProgress(line);
                if (progress !== null && progress !== lastProgress) {
                    lastProgress = progress;
                    if (progressCallback) {
                        progressCallback(Math.min(progress, 99)); // Cap at 99% until file is verified
                    }
                    logger.debug('Conversion progress', { progress: `${progress}%` });
                }

                // Check if complete
                if (isComplete(line)) {
                    logger.info('Conversion appears complete', { line });
                }
            }
        });

        ytDlpProcess.stderr.on('data', (data) => {
            const errorMessage = data.toString();
            errorBuffer += errorMessage;
            logger.debug('yt-dlp stderr', { message: errorMessage });
        });

        ytDlpProcess.on('close', async (code) => {
            if (code === 0) {
                try {
                    // Wait a bit for file to be fully written
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Verify file exists and check size
                    const stats = await fs.stat(outputFile);
                    
                    if (!isValidFileSize(stats.size, config.MAX_FILE_SIZE)) {
                        await fs.unlink(outputFile).catch(() => {});
                        throw new FileSizeError(stats.size, config.MAX_FILE_SIZE);
                    }

                    // Report 100% progress
                    if (progressCallback) {
                        progressCallback(100);
                    }

                    logger.info('Conversion completed successfully', {
                        file: outputFile,
                        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
                    });

                    resolve({
                        success: true,
                        filePath: outputFile,
                        fileSize: stats.size
                    });
                } catch (error) {
                    logger.error('Error verifying converted file', { error: error.message });
                    reject(error);
                }
            } else {
                let errorMsg = 'An error occurred during conversion.';
                
                if (errorBuffer.includes('HTTP Error 403') || errorBuffer.includes('Forbidden')) {
                    errorMsg = 'YouTube is blocking the download (403 Forbidden). This may be due to YouTube\'s anti-bot measures. Please try updating yt-dlp: pip install --upgrade yt-dlp or brew upgrade yt-dlp';
                } else if (errorBuffer.includes('Signature extraction failed')) {
                    errorMsg = 'Signature extraction failed. This is often caused by an outdated yt-dlp version. Please update yt-dlp: pip install --upgrade yt-dlp';
                } else if (errorBuffer.includes('Requested format is not available')) {
                    errorMsg = 'Requested format is not available. This may be due to YouTube restrictions or an outdated yt-dlp version.';
                } else if (errorBuffer.includes('Video unavailable')) {
                    errorMsg = 'Video is unavailable. It may be private, deleted, or restricted.';
                } else if (errorBuffer.includes('Private video')) {
                    errorMsg = 'This video is private and cannot be downloaded.';
                } else if (errorBuffer.includes('SABR streaming')) {
                    errorMsg = 'YouTube is using SABR streaming which may cause download issues. Please update yt-dlp to the latest version: pip install --upgrade yt-dlp';
                }

                logger.error('Conversion failed', {
                    exitCode: code,
                    error: errorBuffer.substring(0, 500) // Limit error buffer length
                });

                reject(new ConversionError(errorMsg, errorBuffer));
            }
        });

        ytDlpProcess.on('error', (error) => {
            logger.error('Failed to start yt-dlp process', { error: error.message });
            reject(new ConversionError('Failed to start conversion process', error.message));
        });
    });
}

module.exports = {
    getVideoInfo,
    convertToMP3
};
