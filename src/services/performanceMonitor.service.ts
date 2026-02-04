import { Request } from 'express';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';

/**
 * Performance metrics interface
 */
export interface PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  requestId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  endpoint: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  successRate: number;
}

/**
 * Performance monitoring service
 */
class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics in memory
  private readonly slowRequestThreshold = 1000; // 1 second
  private readonly errorRateThreshold = 0.1; // 10% error rate

  /**
   * Record a performance metric
   */
  recordMetric(
    req: Request,
    endpoint: string,
    statusCode: number,
    responseTime: number
  ): void {
    const requestId = getRequestId(req);
    const metric: PerformanceMetric = {
      endpoint,
      method: req.method,
      statusCode,
      responseTime,
      timestamp: Date.now(),
      requestId,
      apiKeyId: (req as any).apiKey?.id || (req as any).user?.apiKeyId,
      userId: (req as any).user?.id,
      ip: req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown',
    };

    // Add to metrics array
    this.metrics.push(metric);

    // Trim if exceeds max
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log performance metric
    logger.performance('Performance metric recorded', {
      endpoint,
      method: req.method,
      statusCode,
      responseTime,
      requestId,
      isSlow: responseTime > this.slowRequestThreshold,
    });

    // Check for slow requests
    if (responseTime > this.slowRequestThreshold) {
      this.handleSlowRequest(metric);
    }

    // Check for errors
    if (statusCode >= 400) {
      this.handleError(metric);
    }
  }

  /**
   * Get performance statistics for an endpoint
   */
  getStats(endpoint: string, timeWindow?: number): PerformanceStats {
    const now = Date.now();
    const window = timeWindow || 60 * 60 * 1000; // Default: 1 hour
    const cutoff = now - window;

    const endpointMetrics = this.metrics.filter(
      (m) => m.endpoint === endpoint && m.timestamp >= cutoff
    );

    if (endpointMetrics.length === 0) {
      return {
        endpoint,
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        errorRate: 0,
        successRate: 0,
      };
    }

    const responseTimes = endpointMetrics.map((m) => m.responseTime).sort((a, b) => a - b);
    const successCount = endpointMetrics.filter((m) => m.statusCode < 400).length;
    const errorCount = endpointMetrics.filter((m) => m.statusCode >= 400).length;
    const totalRequests = endpointMetrics.length;

    const sum = responseTimes.reduce((a, b) => a + b, 0);
    const avgResponseTime = sum / responseTimes.length;

    return {
      endpoint,
      totalRequests,
      successCount,
      errorCount,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime: responseTimes[0] || 0,
      maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
      p50: this.percentile(responseTimes, 50),
      p95: this.percentile(responseTimes, 95),
      p99: this.percentile(responseTimes, 99),
      errorRate: errorCount / totalRequests,
      successRate: successCount / totalRequests,
    };
  }

  /**
   * Get all endpoint statistics
   */
  getAllStats(timeWindow?: number): Map<string, PerformanceStats> {
    const endpoints = new Set(this.metrics.map((m) => m.endpoint));
    const stats = new Map<string, PerformanceStats>();

    endpoints.forEach((endpoint) => {
      stats.set(endpoint, this.getStats(endpoint, timeWindow));
    });

    return stats;
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Handle slow request alert
   */
  private handleSlowRequest(metric: PerformanceMetric): void {
    logger.warn('Slow request detected', {
      endpoint: metric.endpoint,
      method: metric.method,
      responseTime: metric.responseTime,
      threshold: this.slowRequestThreshold,
      requestId: metric.requestId,
      apiKeyId: metric.apiKeyId,
    });
  }

  /**
   * Handle error alert
   */
  private handleError(metric: PerformanceMetric): void {
    logger.error('Request error recorded', {
      endpoint: metric.endpoint,
      method: metric.method,
      statusCode: metric.statusCode,
      responseTime: metric.responseTime,
      requestId: metric.requestId,
      apiKeyId: metric.apiKeyId,
    });
  }

  /**
   * Check error rates and trigger alerts
   */
  checkErrorRates(): void {
    const stats = this.getAllStats(5 * 60 * 1000); // Last 5 minutes

    stats.forEach((stat, endpoint) => {
      if (stat.totalRequests > 10 && stat.errorRate > this.errorRateThreshold) {
        logger.warn('High error rate detected', {
          endpoint,
          errorRate: stat.errorRate,
          errorCount: stat.errorCount,
          totalRequests: stat.totalRequests,
          threshold: this.errorRateThreshold,
        });
      }
    });
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
  }
}

export const performanceMonitor = new PerformanceMonitorService();

// Periodically check error rates
setInterval(() => {
  performanceMonitor.checkErrorRates();
}, 5 * 60 * 1000); // Every 5 minutes

// Periodically clear old metrics
setInterval(() => {
  performanceMonitor.clearOldMetrics();
}, 60 * 60 * 1000); // Every hour
