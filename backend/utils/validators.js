/**
 * Validates if a URL is a valid YouTube URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is a valid YouTube URL, false otherwise
 * @example
 * isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ') // true
 * isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ') // true
 * isValidYouTubeUrl('https://example.com') // false
 */
function isValidYouTubeUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    const trimmedUrl = url.trim();
    
    // YouTube URL patterns
    const patterns = [
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/,
        /^https?:\/\/youtube\.com\/watch\?v=[\w-]+/,
        /^https?:\/\/youtu\.be\/[\w-]+/,
        /^https?:\/\/youtube\.com\/embed\/[\w-]+/,
        /^https?:\/\/youtube\.com\/v\/[\w-]+/
    ];

    return patterns.some(pattern => pattern.test(trimmedUrl));
}

/**
 * Sanitizes a filename by removing invalid characters and normalizing it
 * @param {string} filename - The filename to sanitize
 * @returns {string} Sanitized filename safe for filesystem use
 * @example
 * sanitizeFilename('test/file<name>') // 'test_file_name_'
 * sanitizeFilename('  test  ') // 'test'
 */
function sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return 'download';
    }

    // Remove or replace invalid characters
    return filename
        .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid file characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
        .substring(0, 200); // Limit length
}

/**
 * Validates if a file size is within the allowed limit
 * @param {number} sizeInBytes - The file size in bytes
 * @param {number} maxSizeInBytes - The maximum allowed size in bytes
 * @returns {boolean} True if the size is valid (greater than 0 and within limit), false otherwise
 * @example
 * isValidFileSize(1024, 2048) // true
 * isValidFileSize(2049, 2048) // false
 */
function isValidFileSize(sizeInBytes, maxSizeInBytes) {
    return sizeInBytes > 0 && sizeInBytes <= maxSizeInBytes;
}

module.exports = {
    isValidYouTubeUrl,
    sanitizeFilename,
    isValidFileSize
};
