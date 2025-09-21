/**
 * Comprehensive Error Handling Middleware
 * Ensures robust error handling for all API endpoints
 */

class ErrorHandler {
    /**
     * Global error handling middleware
     */
    static handle(err, req, res, next) {
        console.error('🚨 Error occurred:', err);

        // Default error
        let error = { ...err };
        error.message = err.message;

        // Log error details
        console.error(`Error: ${error.message}`);
        console.error(`Stack: ${err.stack}`);
        console.error(`URL: ${req.originalUrl}`);
        console.error(`Method: ${req.method}`);
        console.error(`IP: ${req.ip}`);

        // Mongoose bad ObjectId
        if (err.name === 'CastError') {
            const message = 'Resource not found';
            error = { statusCode: 404, message };
        }

        // Mongoose duplicate key
        if (err.code === 11000) {
            const message = 'Duplicate field value entered';
            error = { statusCode: 400, message };
        }

        // Mongoose validation error
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(val => val.message);
            error = { statusCode: 400, message };
        }

        // JWT errors
        if (err.name === 'JsonWebTokenError') {
            const message = 'Invalid token';
            error = { statusCode: 401, message };
        }

        // JWT expired
        if (err.name === 'TokenExpiredError') {
            const message = 'Token expired';
            error = { statusCode: 401, message };
        }

        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Server Error',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    /**
     * Async error wrapper
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * 404 handler
     */
    static notFound(req, res, next) {
        const error = new Error(`Not found - ${req.originalUrl}`);
        error.statusCode = 404;
        next(error);
    }

    /**
     * Rate limiting error
     */
    static rateLimitHandler(req, res) {
        res.status(429).json({
            success: false,
            error: 'Too many requests, please try again later',
            timestamp: new Date().toISOString(),
            retryAfter: '1 minute'
        });
    }

    /**
     * Validation error helper
     */
    static validationError(message, field = null) {
        const error = new Error(message);
        error.statusCode = 400;
        error.field = field;
        return error;
    }

    /**
     * Authentication error helper
     */
    static authError(message = 'Authentication required') {
        const error = new Error(message);
        error.statusCode = 401;
        return error;
    }

    /**
     * Authorization error helper
     */
    static authzError(message = 'Access denied') {
        const error = new Error(message);
        error.statusCode = 403;
        return error;
    }
}

module.exports = ErrorHandler;
