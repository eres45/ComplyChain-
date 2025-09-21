/**
 * Comprehensive Logging System
 * Provides structured logging for all application events
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '..', 'logs');
        this.ensureLogDirectory();
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Get log filename for current date
     */
    getLogFilename(type = 'app') {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `${type}-${date}.log`);
    }

    /**
     * Write log entry
     */
    writeLog(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...meta
        };

        const logString = JSON.stringify(logEntry) + '\n';

        // Console output with colors
        const colors = {
            ERROR: '\x1b[31m',
            WARN: '\x1b[33m',
            INFO: '\x1b[36m',
            DEBUG: '\x1b[32m',
            RESET: '\x1b[0m'
        };

        console.log(`${colors[level.toUpperCase()] || ''}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.RESET}`);

        // File output
        try {
            fs.appendFileSync(this.getLogFilename(), logString);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Log levels
     */
    error(message, meta = {}) {
        this.writeLog('error', message, meta);
    }

    warn(message, meta = {}) {
        this.writeLog('warn', message, meta);
    }

    info(message, meta = {}) {
        this.writeLog('info', message, meta);
    }

    debug(message, meta = {}) {
        if (process.env.NODE_ENV === 'development') {
            this.writeLog('debug', message, meta);
        }
    }

    /**
     * HTTP request logging middleware
     */
    httpLogger() {
        return (req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                const logData = {
                    method: req.method,
                    url: req.originalUrl,
                    status: res.statusCode,
                    duration: `${duration}ms`,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    contentLength: res.get('Content-Length')
                };

                if (res.statusCode >= 400) {
                    this.error(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
                } else {
                    this.info(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
                }
            });

            next();
        };
    }

    /**
     * Agent activity logger
     */
    logAgentActivity(agentId, action, data = {}) {
        this.info(`Agent Activity: ${agentId} - ${action}`, {
            agent: agentId,
            action,
            ...data
        });

        // Write to separate agent log file
        try {
            const agentLogEntry = {
                timestamp: new Date().toISOString(),
                agent: agentId,
                action,
                ...data
            };
            const agentLogString = JSON.stringify(agentLogEntry) + '\n';
            fs.appendFileSync(this.getLogFilename('agents'), agentLogString);
        } catch (error) {
            this.error('Failed to write agent log', { error: error.message });
        }
    }

    /**
     * Performance monitoring
     */
    logPerformance(operation, duration, meta = {}) {
        const performanceData = {
            operation,
            duration: `${duration}ms`,
            ...meta
        };

        if (duration > 1000) {
            this.warn(`Slow operation detected: ${operation}`, performanceData);
        } else {
            this.debug(`Performance: ${operation}`, performanceData);
        }

        // Write to performance log
        try {
            const perfLogEntry = {
                timestamp: new Date().toISOString(),
                ...performanceData
            };
            const perfLogString = JSON.stringify(perfLogEntry) + '\n';
            fs.appendFileSync(this.getLogFilename('performance'), perfLogString);
        } catch (error) {
            this.error('Failed to write performance log', { error: error.message });
        }
    }

    /**
     * Security event logging
     */
    logSecurityEvent(event, severity, details = {}) {
        const securityData = {
            event,
            severity: severity.toUpperCase(),
            ...details
        };

        this.warn(`Security Event: ${event}`, securityData);

        // Write to security log
        try {
            const secLogEntry = {
                timestamp: new Date().toISOString(),
                ...securityData
            };
            const secLogString = JSON.stringify(secLogEntry) + '\n';
            fs.appendFileSync(this.getLogFilename('security'), secLogString);
        } catch (error) {
            this.error('Failed to write security log', { error: error.message });
        }
    }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
