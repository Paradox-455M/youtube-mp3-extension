const winston = require('winston');
const path = require('path');

/**
 * Create and configure Winston logger
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'youtube-mp3-converter' },
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    let msg = `${timestamp} [${level}]: ${message}`;
                    if (Object.keys(meta).length > 0) {
                        msg += ` ${JSON.stringify(meta)}`;
                    }
                    return msg;
                })
            )
        })
    ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    const logsDir = path.join(__dirname, '..', 'logs');
    require('fs').mkdirSync(logsDir, { recursive: true });

    logger.add(new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));

    logger.add(new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));
}

/**
 * Express middleware to add logger to request object
 */
function loggerMiddleware(req, res, next) {
    req.logger = logger;
    next();
}

module.exports = {
    logger,
    loggerMiddleware
};
