/**
 * Storage utilities for extension
 */

const STORAGE_KEYS = {
    DOWNLOAD_HISTORY: 'downloadHistory',
    SETTINGS: 'settings'
};

/**
 * Get download history
 * @returns {Promise<Array>} Array of download history items
 */
async function getDownloadHistory() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DOWNLOAD_HISTORY);
    return result[STORAGE_KEYS.DOWNLOAD_HISTORY] || [];
}

/**
 * Add item to download history
 * @param {object} item - Download history item
 */
async function addToDownloadHistory(item) {
    const history = await getDownloadHistory();
    history.unshift({
        ...item,
        timestamp: Date.now()
    });
    
    // Keep only last 100 items
    if (history.length > 100) {
        history.splice(100);
    }
    
    await chrome.storage.local.set({
        [STORAGE_KEYS.DOWNLOAD_HISTORY]: history
    });
}

/**
 * Clear download history
 */
async function clearDownloadHistory() {
    await chrome.storage.local.remove(STORAGE_KEYS.DOWNLOAD_HISTORY);
}

/**
 * Get settings
 * @returns {Promise<object>} Settings object
 */
async function getSettings() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return result[STORAGE_KEYS.SETTINGS] || {
        audioQuality: '0',
        audioFormat: 'mp3',
        autoDownload: true
    };
}

/**
 * Save settings
 * @param {object} settings - Settings object
 */
async function saveSettings(settings) {
    const currentSettings = await getSettings();
    await chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: {
            ...currentSettings,
            ...settings
        }
    });
}

module.exports = {
    getDownloadHistory,
    addToDownloadHistory,
    clearDownloadHistory,
    getSettings,
    saveSettings
};
