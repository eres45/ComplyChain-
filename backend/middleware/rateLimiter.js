/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

const rateLimit = require('express-rate-limit');
const logger = require('./logger');

class RateLimiter {
    /**
     * General API rate limiter
     */
    static general() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                success: false,
                error: 'Too many requests from this IP, please try again later',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                logger.logSecurityEvent('RATE_LIMIT_EXCEEDED', 'medium', {
                    ip: req.ip,
                    url: req.originalUrl,
                    userAgent: req.get('User-Agent')
                });
                
                res.status(429).json({
                    success: false,
                    error: 'Too many requests from this IP, please try again later',
                    retryAfter: '15 minutes',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    /**
     * Strict rate limiter for sensitive endpoints
     */
    static strict() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // limit each IP to 10 requests per windowMs
            message: {
                success: false,
                error: 'Too many requests to sensitive endpoint, please try again later',
                retryAfter: '15 minutes'
            },
            handler: (req, res) => {
                logger.logSecurityEvent('STRICT_RATE_LIMIT_EXCEEDED', 'high', {
                    ip: req.ip,
                    url: req.originalUrl,
                    userAgent: req.get('User-Agent')
                });
                
                res.status(429).json({
                    success: false,
                    error: 'Too many requests to sensitive endpoint, please try again later',
                    retryAfter: '15 minutes',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    /**
     * Demo endpoint rate limiter
     */
    static demo() {
        return rateLimit({
            windowMs: 5 * 60 * 1000, // 5 minutes
            max: 5, // limit each IP to 5 demo requests per 5 minutes
            message: {
                success: false,
                error: 'Demo rate limit exceeded, please wait before trying again',
                retryAfter: '5 minutes'
            },
            handler: (req, res) => {
                logger.logSecurityEvent('DEMO_RATE_LIMIT_EXCEEDED', 'low', {
                    ip: req.ip,
                    url: req.originalUrl
                });
                
                res.status(429).json({
                    success: false,
                    error: 'Demo rate limit exceeded, please wait before trying again',
                    retryAfter: '5 minutes',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    /**
     * Payment endpoint rate limiter
     */
    static payment() {
        return rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 20, // limit each IP to 20 payment requests per hour
            message: {
                success: false,
                error: 'Payment rate limit exceeded for security, please try again later',
                retryAfter: '1 hour'
            },
            handler: (req, res) => {
                logger.logSecurityEvent('PAYMENT_RATE_LIMIT_EXCEEDED', 'high', {
                    ip: req.ip,
                    url: req.originalUrl,
                    userAgent: req.get('User-Agent')
                });
                
                res.status(429).json({
                    success: false,
                    error: 'Payment rate limit exceeded for security, please try again later',
                    retryAfter: '1 hour',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }
}

module.exports = RateLimiter;
