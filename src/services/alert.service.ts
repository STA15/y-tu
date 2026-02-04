import { logger } from '../utils/logger';
import { performanceMonitor, PerformanceStats } from './performanceMonitor.service';
import { usageMetricsService } from '../utils/usageMetrics';

/**
 * Alert configuration
 */
interface AlertConfig {
  highErrorRateThreshold: number; // 0.1 = 10%
  slowResponseTimeThreshold: number; // milliseconds
  rateLimitAbuseThreshold: number; // requests per minute
  checkInterval: number; // milliseconds
}

/**
 * Alert types
 */
export enum AlertType {
  HIGH_ERROR_RATE = 'HIGH_ERROR_RATE',
  SLOW_RESPONSE_TIME = 'SLOW_RESPONSE_TIME',
  RATE_LIMIT_ABUSE = 'RATE_LIMIT_ABUSE',
  HIGH_ERROR_COUNT = 'HIGH_ERROR_COUNT',
}

/**
 * Alert interface
 */
export interface Alert {
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: Record<string, any>;
  timestamp: number;
}

/**
 * Alert service for monitoring and alerting
 */
class AlertService {
  private alerts: Alert[] = [];
  private readonly maxAlerts = 1000;
  private config: AlertConfig = {
    highErrorRateThreshold: 0.1, // 10%
    slowResponseTimeThreshold: 2000, // 2 seconds
    rateLimitAbuseThreshold: 100, // requests per minute
    checkInterval: 60 * 1000, // 1 minute
  };

  /**
   * Initialize alert service
   */
  constructor() {
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start monitoring and alerting
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.checkAlerts();
    }, this.config.checkInterval);
  }

  /**
   * Check for alerts
   */
  private checkAlerts(): void {
    this.checkErrorRates();
    this.checkSlowResponseTimes();
    this.checkRateLimitAbuse();
  }

  /**
   * Check for high error rates
   */
  private checkErrorRates(): void {
    const stats = performanceMonitor.getAllStats(5 * 60 * 1000); // Last 5 minutes

    stats.forEach((stat, endpoint) => {
      if (stat.totalRequests < 10) return; // Need minimum requests

      if (stat.errorRate > this.config.highErrorRateThreshold) {
        const severity = this.determineSeverity(stat.errorRate, 0.1, 0.25, 0.5);
        
        this.triggerAlert({
          type: AlertType.HIGH_ERROR_RATE,
          severity,
          message: `High error rate detected on ${endpoint}: ${(stat.errorRate * 100).toFixed(1)}%`,
          metadata: {
            endpoint,
            errorRate: stat.errorRate,
            errorCount: stat.errorCount,
            totalRequests: stat.totalRequests,
            threshold: this.config.highErrorRateThreshold,
          },
          timestamp: Date.now(),
        });
      }

      // Check for high absolute error count
      if (stat.errorCount > 50) {
        this.triggerAlert({
          type: AlertType.HIGH_ERROR_COUNT,
          severity: 'high',
          message: `High error count on ${endpoint}: ${stat.errorCount} errors in last 5 minutes`,
          metadata: {
            endpoint,
            errorCount: stat.errorCount,
            totalRequests: stat.totalRequests,
          },
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Check for slow response times
   */
  private checkSlowResponseTimes(): void {
    const stats = performanceMonitor.getAllStats(5 * 60 * 1000); // Last 5 minutes

    stats.forEach((stat, endpoint) => {
      if (stat.totalRequests < 10) return;

      if (stat.p95 > this.config.slowResponseTimeThreshold) {
        const severity = this.determineSeverity(
          stat.p95,
          this.config.slowResponseTimeThreshold,
          this.config.slowResponseTimeThreshold * 2,
          this.config.slowResponseTimeThreshold * 5
        );

        this.triggerAlert({
          type: AlertType.SLOW_RESPONSE_TIME,
          severity,
          message: `Slow response time on ${endpoint}: p95 = ${stat.p95}ms`,
          metadata: {
            endpoint,
            p95: stat.p95,
            p99: stat.p99,
            avgResponseTime: stat.avgResponseTime,
            maxResponseTime: stat.maxResponseTime,
            threshold: this.config.slowResponseTimeThreshold,
          },
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Check for rate limit abuse
   */
  private checkRateLimitAbuse(): void {
    // This would integrate with rate limiter to detect abuse
    // For now, we log a placeholder
    logger.debug('Rate limit abuse check', {
      note: 'Rate limit abuse detection would be implemented here',
    });
  }

  /**
   * Determine alert severity
   */
  private determineSeverity(
    value: number,
    lowThreshold: number,
    mediumThreshold: number,
    highThreshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (value >= highThreshold) return 'critical';
    if (value >= mediumThreshold) return 'high';
    if (value >= lowThreshold) return 'medium';
    return 'low';
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: Alert): void {
    // Add to alerts array
    this.alerts.push(alert);

    // Trim if exceeds max
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.shift();
    }

    // Log alert based on severity
    const logLevel = this.getLogLevel(alert.severity);
    logger[logLevel](`ALERT: ${alert.message}`, {
      type: alert.type,
      severity: alert.severity,
      ...alert.metadata,
    });

    // Send to Sentry for critical/high alerts
    if (alert.severity === 'critical' || alert.severity === 'high') {
      try {
        const { captureMessage } = require('../utils/sentry');
        captureMessage(alert.message, 'warning');
      } catch (e) {
        // Sentry not available
      }
    }
  }

  /**
   * Get log level from severity
   */
  private getLogLevel(severity: string): 'error' | 'warn' | 'info' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'info';
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: AlertType, limit: number = 100): Alert[] {
    return this.alerts
      .filter((a) => a.type === type)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: string, limit: number = 100): Alert[] {
    return this.alerts
      .filter((a) => a.severity === severity)
      .slice(-limit)
      .reverse();
  }

  /**
   * Update alert configuration
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get alert configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config };
  }
}

export const alertService = new AlertService();
