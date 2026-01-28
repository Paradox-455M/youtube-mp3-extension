/**
 * Parse yt-dlp progress output to extract real progress percentage
 */

/**
 * Parse progress from yt-dlp output line
 * @param {string} line - Output line from yt-dlp
 * @returns {number|null} Progress percentage (0-100) or null if not found
 */
function parseProgress(line) {
    if (!line || typeof line !== 'string') {
        return null;
    }

    // Pattern 1: [download] XX.X% of YY.YMiB at ZZ.ZMiB/s ETA MM:SS
    const downloadPattern = /\[download\]\s+(\d+\.?\d*)%/i;
    const downloadMatch = line.match(downloadPattern);
    if (downloadMatch) {
        return parseFloat(downloadMatch[1]);
    }

    // Pattern 2: [ExtractAudio] Destination: filename.mp3
    // Pattern 3: [ffmpeg] ...
    // These indicate progress but don't have percentage

    // Pattern 4: [Merger] Merging formats into "filename.mp3"
    // This is near completion

    return null;
}

/**
 * Parse download speed from yt-dlp output
 * @param {string} line - Output line from yt-dlp
 * @returns {string|null} Download speed string or null
 */
function parseDownloadSpeed(line) {
    if (!line || typeof line !== 'string') {
        return null;
    }

    const speedPattern = /at\s+([\d.]+[KMGT]?i?B\/s)/i;
    const match = line.match(speedPattern);
    return match ? match[1] : null;
}

/**
 * Parse ETA from yt-dlp output
 * @param {string} line - Output line from yt-dlp
 * @returns {string|null} ETA string (MM:SS) or null
 */
function parseETA(line) {
    if (!line || typeof line !== 'string') {
        return null;
    }

    const etaPattern = /ETA\s+(\d+:\d+)/i;
    const match = line.match(etaPattern);
    return match ? match[1] : null;
}

/**
 * Check if line indicates conversion is complete
 * @param {string} line - Output line from yt-dlp
 * @returns {boolean} True if conversion appears complete
 */
function isComplete(line) {
    if (!line || typeof line !== 'string') {
        return false;
    }

    const completeIndicators = [
        /\[download\]\s+100%/i,
        /\[ExtractAudio\]\s+Destination:/i,
        /\[Merger\]\s+Merging formats/i,
        /Deleting original file/i
    ];

    return completeIndicators.some(pattern => pattern.test(line));
}

/**
 * Extract video info from yt-dlp output
 * @param {string} line - Output line from yt-dlp
 * @returns {object|null} Video info or null
 */
function parseVideoInfo(line) {
    if (!line || typeof line !== 'string') {
        return null;
    }

    // Extract title if available
    const titlePattern = /\[info\]\s+(.+)/i;
    const titleMatch = line.match(titlePattern);
    
    return titleMatch ? { title: titleMatch[1] } : null;
}

module.exports = {
    parseProgress,
    parseDownloadSpeed,
    parseETA,
    isComplete,
    parseVideoInfo
};
