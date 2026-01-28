module.exports = {
    // Maximum file size in bytes (default: 100MB)
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE 
        ? parseInt(process.env.MAX_FILE_SIZE) 
        : 100 * 1024 * 1024,
    
    // Time to keep files before cleanup (in milliseconds)
    FILE_CLEANUP_TIME: process.env.FILE_CLEANUP_TIME 
        ? parseInt(process.env.FILE_CLEANUP_TIME) 
        : 3600000, // 1 hour
    
    // Allowed origins for CORS
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : [
            'chrome-extension://bhpjjmaokjcoooachclbdfbdeajpgcno',
            'http://localhost:4000'
        ]
};