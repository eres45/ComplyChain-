/**
 * Performance Monitoring Middleware
 * Tracks API performance and system metrics
 */

const logger = require('./logger');

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: 0,
            totalResponseTime: 0,
            slowRequests: 0,
            errors: 0,
            activeConnections: 0
        };
        
        this.startTime = Date.now();
        this.slowRequestThreshold = 1000; // 1 second
    }

    /**
     * Performance monitoring middleware
     */
    monitor() {
        return (req, res, next) => {
            const startTime = Date.now();
            this.metrics.requests++;
            this.metrics.activeConnections++;

            // Track request completion
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                this.metrics.totalResponseTime += duration;
                this.metrics.activeConnections--;

                // Log slow requests
                if (duration > this.slowRequestThreshold) {
                    this.metrics.slowRequests++;
                    logger.logPerformance('SLOW_REQUEST', duration, {
                        method: req.method,
                        url: req.originalUrl,
                        status: res.statusCode,
                        ip: req.ip
                    });
                }

                // Log errors
                if (res.statusCode >= 400) {
                    this.metrics.errors++;
                }

                // Log performance metrics every 100 requests
                if (this.metrics.requests % 100 === 0) {
                    this.logMetrics();
                }
            });

            next();
        };
    }

    /**
     * Get current performance metrics
     */
    getMetrics() {
        const uptime = Date.now() - this.startTime;
        const avgResponseTime = this.metrics.requests > 0 
            ? this.metrics.totalResponseTime / this.metrics.requests 
            : 0;

        return {
            uptime: Math.floor(uptime / 1000), // seconds
            requests: this.metrics.requests,
            averageResponseTime: Math.round(avgResponseTime),
            slowRequests: this.metrics.slowRequests,
            errors: this.metrics.errors,
            activeConnections: this.metrics.activeConnections,
            errorRate: this.metrics.requests > 0 
                ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) + '%'
                : '0%',
            requestsPerSecond: this.metrics.requests > 0 
                ? (this.metrics.requests / (uptime / 1000)).toFixed(2)
                : '0'
        };
    }

    /**
     * Log current metrics
     */
    logMetrics() {
        const metrics = this.getMetrics();
        logger.info('Performance Metrics', metrics);
    }

    /**
     * Health check endpoint data
     */
    getHealthData() {
        const metrics = this.getMetrics();
        
        return {
            status: this.determineHealthStatus(metrics),
            metrics,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Determine overall health status
     */
    determineHealthStatus(metrics) {
        if (metrics.errorRate > 10) return 'unhealthy';
        if (metrics.averageResponseTime > 2000) return 'degraded';
        if (metrics.slowRequests > metrics.requests * 0.1) return 'degraded';
        return 'healthy';
    }

    /**
     * Memory usage monitoring
     */
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
            external: Math.round(usage.external / 1024 / 1024) + ' MB'
        };
    }

    /**
     * System resource monitoring
     */
    getSystemInfo() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            uptime: Math.floor(process.uptime()),
            memory: this.getMemoryUsage()
        };
    }

    /**
     * Agent performance tracking
     */
    trackAgentPerformance(agentId, operation, duration, success = true) {
        const performanceData = {
            agent: agentId,
            operation,
            duration,
            success,
            timestamp: new Date().toISOString()
        };

        logger.logAgentActivity(agentId, `PERFORMANCE_${operation.toUpperCase()}`, performanceData);

        // Alert on slow agent operations
        if (duration > 5000) { // 5 seconds
            logger.warn(`Slow agent operation: ${agentId}.${operation}`, performanceData);
        }
    }

    /**
     * Coral Protocol performance tracking
     */
    trackCoralPerformance(operation, duration, success = true) {
        const performanceData = {
            service: 'coral-protocol',
            operation,
            duration,
            success,
            timestamp: new Date().toISOString()
        };

        logger.logPerformance('CORAL_PROTOCOL', duration, performanceData);

        // Alert on Coral Protocol issues
        if (!success || duration > 10000) { // 10 seconds
            logger.warn(`Coral Protocol performance issue: ${operation}`, performanceData);
        }
    }

    /**
     * Reset metrics (for testing)
     */
    reset() {
        this.metrics = {
            requests: 0,
            totalResponseTime: 0,
            slowRequests: 0,
            errors: 0,
            activeConnections: 0
        };
        this.startTime = Date.now();
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
