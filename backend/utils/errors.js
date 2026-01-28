/**
 * Custom error classes for better error handling
 */

class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, field = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

class ConversionError extends AppError {
    constructor(message, details = null) {
        super(message, 500, 'CONVERSION_ERROR');
        this.details = details;
    }
}

class FileSizeError extends AppError {
    constructor(fileSize, maxSize) {
        const sizeMB = (fileSize / 1024 / 1024).toFixed(2);
        const maxMB = (maxSize / 1024 / 1024).toFixed(2);
        super(
            `File size (${sizeMB} MB) exceeds maximum allowed size (${maxMB} MB)`,
            400,
            'FILE_SIZE_EXCEEDED'
        );
        this.fileSize = fileSize;
        this.maxSize = maxSize;
    }
}

class RateLimitError extends AppError {
    constructor(retryAfter = null) {
        super('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
        this.retryAfter = retryAfter;
    }
}

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
    // Log error
    if (err.isOperational) {
        req.logger?.warn('Operational error:', {
            error: err.message,
            code: err.code,
            statusCode: err.statusCode,
            stack: err.stack
        });
    } else {
        req.logger?.error('Unexpected error:', {
            error: err.message,
            stack: err.stack
        });
    }

    // Set CORS headers
    const origin = req.headers.origin;
    if (origin && (origin.startsWith('chrome-extension://') || origin.includes('localhost'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Send error response
    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        error: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR'
    };

    // Add details in development
    if (process.env.NODE_ENV === 'development' && err.details) {
        response.details = err.details;
    }

    // Add retry-after header for rate limit errors
    if (err instanceof RateLimitError && err.retryAfter) {
        res.setHeader('Retry-After', err.retryAfter);
    }

    res.status(statusCode).json(response);
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    ConversionError,
    FileSizeError,
    RateLimitError,
    errorHandler
};
