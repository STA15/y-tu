import { ApiKeyRequest } from '../middleware/apiKeyAuth';
import { logger } from './logger';

/**
 * Usage metrics tracking per API key
 */
interface UsageMetric {
  apiKeyId: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  responseTime: number;
  statusCode: number;
  success: boolean;
  metadata?: {
    textLength?: number;
    language?: string;
    score?: number;
    [key: string]: any;
  };
}

class UsageMetricsService {
  private metrics: UsageMetric[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k metrics in memory

  /**
   * Track API usage
   */
  trackUsage(
    req: ApiKeyRequest,
    endpoint: string,
    responseTime: number,
    statusCode: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const apiKeyId = req.apiKey?.id || req.user?.apiKeyId || 'unknown';

    const metric: UsageMetric = {
      apiKeyId,
      endpoint,
      method: req.method,
      timestamp: new Date(),
      responseTime,
      statusCode,
      success,
      metadata
    };

    this.metrics.push(metric);

    // Trim if exceeds max
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log for monitoring
    logger.info('API usage tracked', {
      apiKeyId,
      endpoint,
      responseTime,
      statusCode,
      success,
      type: 'usage_metric',
    });
  }

  /**
   * Get usage statistics for an API key
   */
  getUsageStats(apiKeyId: string, timeRange?: { start: Date; end: Date }): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    endpoints: Record<string, number>;
  } {
    let filtered = this.metrics.filter(m => m.apiKeyId === apiKeyId);

    if (timeRange) {
      filtered = filtered.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    const totalRequests = filtered.length;
    const successfulRequests = filtered.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime = filtered.length > 0
      ? filtered.reduce((sum, m) => sum + m.responseTime, 0) / filtered.length
      : 0;

    const endpoints: Record<string, number> = {};
    filtered.forEach(m => {
      endpoints[m.endpoint] = (endpoints[m.endpoint] || 0) + 1;
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      endpoints
    };
  }

  /**
   * Clear old metrics (older than 24 hours)
   */
  clearOldMetrics(): void {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    this.metrics = this.metrics.filter(m => m.timestamp >= oneDayAgo);
  }
}

export const usageMetricsService = new UsageMetricsService();

// Cleanup old metrics every hour
setInterval(() => {
  usageMetricsService.clearOldMetrics();
}, 60 * 60 * 1000);
