# Monitoring and Logging System

Comprehensive monitoring and logging system for the Y TU API using Winston.

## Features

### 1. Winston Logger

- **Multiple Log Levels**: error, warn, info, debug
- **File Logging**: Daily rotating log files
- **Console Logging**: Colorized output for development
- **Structured Logging**: JSON format for production
- **Request/Response Logging**: Automatic logging of all requests
- **Error Stack Traces**: Full stack traces for errors

### 2. Performance Monitoring

- **Response Time Tracking**: Track response times for all endpoints
- **Success/Error Rates**: Monitor success and error rates
- **Percentile Metrics**: p50, p95, p99 response times
- **Rate Limit Tracking**: Monitor rate limit hits
- **API Key Usage**: Track usage per API key

### 3. Logging Middleware

- **Request Logging**: Log all incoming requests with:
  - Request ID for tracing
  - Method, path, query, params
  - Redacted sensitive data
  - IP address and user agent
  - API key and user information

- **Response Logging**: Log all responses with:
  - Status code
  - Response time
  - Request ID
  - Error details (if applicable)

- **Sensitive Data Redaction**: Automatically redacts:
  - API keys
  - Passwords
  - Tokens
  - Authorization headers
  - Credit card numbers
  - SSNs

### 4. Alert System

- **High Error Rates**: Alerts when error rate > 10%
- **Slow Response Times**: Alerts when p95 > 2 seconds
- **Rate Limit Abuse**: Monitors rate limit violations
- **High Error Counts**: Alerts when error count > 50 in 5 minutes

## Log Files

### Production Logs

Logs are stored in the `logs/` directory:

- **error-YYYY-MM-DD.log**: Error level logs only
- **combined-YYYY-MM-DD.log**: All log levels
- **requests-YYYY-MM-DD.log**: Request/response logs
- **exceptions-YYYY-MM-DD.log**: Uncaught exceptions
- **rejections-YYYY-MM-DD.log**: Unhandled promise rejections

### Log Rotation

- **Max Size**: 20 MB per file
- **Retention**: 
  - Error/Combined: 30 days
  - Requests: 14 days
- **Compression**: Old logs are automatically compressed

## Log Levels

### Error
Critical errors that require immediate attention:
- Server errors (5xx)
- Uncaught exceptions
- Database errors
- External service failures

### Warn
Warnings that should be monitored:
- Client errors (4xx)
- Rate limit hits
- Slow requests
- Deprecated API usage

### Info
General information:
- Successful requests
- API usage
- Performance metrics
- System events

### Debug
Detailed debugging information (development only):
- Request/response details
- Internal state
- Function calls

## Performance Monitoring

### Metrics Tracked

- **Response Time**: Average, min, max, p50, p95, p99
- **Success Rate**: Percentage of successful requests
- **Error Rate**: Percentage of failed requests
- **Request Count**: Total requests per endpoint
- **API Key Usage**: Usage statistics per API key

### Accessing Metrics

```bash
# Get performance stats for all endpoints
GET /api/v1/monitoring/performance

# Get performance stats for specific endpoint
GET /api/v1/monitoring/performance?endpoint=/api/v1/translate

# Get stats for last hour (default)
GET /api/v1/monitoring/performance?timeWindow=3600000
```

### Response Format

```json
{
  "success": true,
  "data": {
    "timeWindow": 3600000,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "stats": {
      "/api/v1/translate": {
        "endpoint": "/api/v1/translate",
        "totalRequests": 1000,
        "successCount": 950,
        "errorCount": 50,
        "avgResponseTime": 234,
        "minResponseTime": 45,
        "maxResponseTime": 1234,
        "p50": 200,
        "p95": 500,
        "p99": 800,
        "errorRate": 0.05,
        "successRate": 0.95
      }
    }
  }
}
```

## Alert System

### Alert Types

1. **HIGH_ERROR_RATE**: Error rate exceeds threshold (default: 10%)
2. **SLOW_RESPONSE_TIME**: p95 response time exceeds threshold (default: 2s)
3. **RATE_LIMIT_ABUSE**: Rate limit violations detected
4. **HIGH_ERROR_COUNT**: High absolute error count (> 50 in 5 minutes)

### Alert Severity

- **Critical**: Requires immediate action
- **High**: Should be addressed soon
- **Medium**: Monitor closely
- **Low**: Informational

### Accessing Alerts

```bash
# Get recent alerts
GET /api/v1/monitoring/alerts

# Get alerts by severity
GET /api/v1/monitoring/alerts?severity=high

# Get alerts by type
GET /api/v1/monitoring/alerts?type=HIGH_ERROR_RATE

# Limit results
GET /api/v1/monitoring/alerts?limit=50
```

### Alert Response Format

```json
{
  "success": true,
  "data": {
    "count": 5,
    "alerts": [
      {
        "type": "HIGH_ERROR_RATE",
        "severity": "high",
        "message": "High error rate detected on /api/v1/translate: 15.2%",
        "metadata": {
          "endpoint": "/api/v1/translate",
          "errorRate": 0.152,
          "errorCount": 152,
          "totalRequests": 1000
        },
        "timestamp": 1704067200000
      }
    ]
  }
}
```

## Configuration

### Environment Variables

```bash
# Log directory (default: ./logs)
LOG_DIR=/var/log/ytu-api

# Enable file logging in development (default: false)
LOG_TO_FILE=true

# Log level (default: info for production, debug for development)
LOG_LEVEL=info
```

### Alert Configuration

Alerts can be configured programmatically:

```typescript
import { alertService } from './services/alert.service';

alertService.updateConfig({
  highErrorRateThreshold: 0.15, // 15%
  slowResponseTimeThreshold: 3000, // 3 seconds
  rateLimitAbuseThreshold: 200, // requests per minute
  checkInterval: 60000, // 1 minute
});
```

## Request Tracing

Every request gets a unique request ID that can be used for tracing:

```json
{
  "requestId": "req_1704067200000_abc123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "INFO",
  "message": "Incoming request",
  "method": "POST",
  "path": "/api/v1/translate",
  "ip": "192.168.1.1"
}
```

Use the request ID to trace a request through all logs:

```bash
# Search logs for specific request
grep "req_1704067200000_abc123" logs/combined-*.log
```

## Best Practices

1. **Monitor Error Rates**: Set up alerts for high error rates
2. **Track Performance**: Monitor p95 and p99 response times
3. **Review Logs Regularly**: Check logs for patterns and issues
4. **Use Request IDs**: Include request ID in error reports
5. **Set Appropriate Log Levels**: Use debug only in development
6. **Rotate Logs**: Ensure log rotation is working
7. **Monitor Disk Space**: Logs can grow large, monitor disk usage

## Integration with Sentry

Alerts are automatically sent to Sentry for critical/high severity:

- Critical alerts → Sentry error
- High alerts → Sentry warning
- Medium/Low alerts → Logged only

## Performance Impact

- **Minimal Overhead**: Logging adds < 1ms per request
- **Async Operations**: File writes are asynchronous
- **Memory Management**: Old metrics are automatically cleared
- **Efficient Storage**: Logs are compressed after rotation

## Troubleshooting

### Logs Not Appearing

1. Check `LOG_DIR` is writable
2. Verify `LOG_TO_FILE` is set if needed
3. Check disk space
4. Review file permissions

### High Memory Usage

1. Reduce `maxMetrics` in performance monitor
2. Increase cleanup frequency
3. Reduce log retention period

### Missing Request IDs

Ensure `requestStartTimeMiddleware` is applied early in middleware chain.

## API Endpoints

- `GET /api/v1/monitoring/performance` - Performance statistics
- `GET /api/v1/monitoring/alerts` - Recent alerts
- `GET /api/v1/metrics/usage` - API key usage metrics
