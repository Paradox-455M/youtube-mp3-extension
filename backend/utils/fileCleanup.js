const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

/**
 * Clean up old temporary files
 * @param {string} tempDir - Directory containing temp files
 * @returns {Promise<number>} Number of files deleted
 */
async function cleanupOldFiles(tempDir) {
    try {
        const files = await fs.readdir(tempDir);
        const now = Date.now();
        let deletedCount = 0;

        for (const file of files) {
            const filePath = path.join(tempDir, file);
            try {
                const stats = await fs.stat(filePath);
                const age = now - stats.birthtime.getTime();

                // Delete files older than cleanup time
                if (age > config.FILE_CLEANUP_TIME) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    console.log(`🗑️ Cleaned up old file: ${file}`);
                }
            } catch (error) {
                console.error(`❌ Error cleaning up file ${file}:`, error.message);
            }
        }

        return deletedCount;
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        return 0;
    }
}

/**
 * Get total size of temp directory
 * @param {string} tempDir - Directory to check
 * @returns {Promise<number>} Total size in bytes
 */
async function getTempDirSize(tempDir) {
    try {
        const files = await fs.readdir(tempDir);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(tempDir, file);
            try {
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
            } catch (error) {
                // Skip files that can't be accessed
            }
        }

        return totalSize;
    } catch (error) {
        return 0;
    }
}

module.exports = {
    cleanupOldFiles,
    getTempDirSize
};
