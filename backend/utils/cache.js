/**
 * Simple in-memory cache for video metadata
 */

class Cache {
    constructor(ttl = 3600000) { // Default 1 hour TTL
        this.cache = new Map();
        this.ttl = ttl;
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if not found/expired
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (optional)
     */
    set(key, value, ttl = null) {
        const expiry = Date.now() + (ttl || this.ttl);
        this.cache.set(key, { value, expiry });
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Get cache size
     * @returns {number} Number of entries
     */
    size() {
        return this.cache.size;
    }

    /**
     * Clean expired entries
     */
    cleanExpired() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// Create singleton instance
const videoInfoCache = new Cache(parseInt(process.env.CACHE_TTL_MS) || 3600000); // 1 hour default

// Clean expired entries every 10 minutes
setInterval(() => {
    videoInfoCache.cleanExpired();
}, 10 * 60 * 1000);

module.exports = {
    Cache,
    videoInfoCache
};
