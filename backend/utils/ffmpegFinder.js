const { execSync } = require('child_process');
const path = require('path');

/**
 * Finds the FFmpeg executable path by checking environment variables and common installation locations
 * @returns {string|null} Path to FFmpeg executable or null if not found
 * @description Checks FFMPEG_PATH environment variable first, then common paths for the current platform
 */
function findFFmpeg() {
    // Check environment variable first
    if (process.env.FFMPEG_PATH) {
        return process.env.FFMPEG_PATH;
    }

    // Common paths for different platforms
    const commonPaths = {
        darwin: [
            '/opt/homebrew/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/opt/local/bin/ffmpeg'
        ],
        win32: [
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'ffmpeg', 'bin', 'ffmpeg.exe')
        ],
        linux: [
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/opt/ffmpeg/bin/ffmpeg'
        ]
    };

    const platform = process.platform;
    const pathsToCheck = commonPaths[platform] || [];

    // Try to find FFmpeg in PATH
    try {
        const whichCommand = platform === 'win32' ? 'where' : 'which';
        const ffmpegPath = execSync(`${whichCommand} ffmpeg`, { encoding: 'utf-8' }).trim();
        if (ffmpegPath) {
            return ffmpegPath.split('\n')[0]; // Take first result
        }
    } catch (error) {
        // FFmpeg not in PATH, continue checking common paths
    }

    // Check common paths
    const fs = require('fs');
    for (const testPath of pathsToCheck) {
        try {
            if (fs.existsSync(testPath)) {
                return testPath;
            }
        } catch (error) {
            // Continue checking
        }
    }

    return null;
}

/**
 * Finds the FFprobe executable path, typically in the same directory as FFmpeg
 * @returns {string|null} Path to FFprobe executable or null if not found
 */
function findFFprobe() {
    // Check environment variable first
    if (process.env.FFPROBE_PATH) {
        return process.env.FFPROBE_PATH;
    }

    const ffmpegPath = findFFmpeg();
    if (!ffmpegPath) {
        return null;
    }

    // FFprobe is usually in the same directory as FFmpeg
    const platform = process.platform;
    if (platform === 'win32') {
        return ffmpegPath.replace('ffmpeg.exe', 'ffprobe.exe');
    } else {
        return ffmpegPath.replace('ffmpeg', 'ffprobe');
    }
}

/**
 * Verifies that FFmpeg is installed and accessible by running a version check
 * @returns {boolean} True if FFmpeg is available and working, false otherwise
 */
function verifyFFmpeg() {
    const ffmpegPath = findFFmpeg();
    if (!ffmpegPath) {
        return false;
    }

    try {
        const { execSync } = require('child_process');
        execSync(`"${ffmpegPath}" -version`, { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    findFFmpeg,
    findFFprobe,
    verifyFFmpeg
};
