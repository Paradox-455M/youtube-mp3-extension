module.exports = {
    // Maximum file size in bytes (default: 100MB)
    MAX_FILE_SIZE: 100 * 1024 * 1024,
    
    // Time to keep files before cleanup (in milliseconds)
    FILE_CLEANUP_TIME: 3600000, // 1 hour
    
    // Allowed origins for CORS
    ALLOWED_ORIGINS: [
        'chrome-extension://bhpjjmaokjcoooachclbdfbdeajpgcno',
        'http://localhost:4000'
    ]
};