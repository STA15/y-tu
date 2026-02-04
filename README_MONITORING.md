# Monitoring and Logging System

## Overview

The Y TU API includes a comprehensive monitoring and logging system built with Winston, providing:

- **Structured Logging**: JSON format for easy parsing
- **File Rotation**: Daily rotating log files with compression
- **Performance Monitoring**: Track response times, success/error rates
- **Alert System**: Automatic alerts for errors, slow responses, and rate limits
- **Request Tracing**: Unique request IDs for end-to-end tracing

## Quick Start

### View Logs

```bash
# View recent error logs
tail -f logs/error-$(date +%Y-%m-%d).log

# View all logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# View request logs
tail -f logs/requests-$(date +%Y-%m-%d).log
```

### Check Performance

```bash
# Get performance stats
curl -H "X-API-Key: your-key" \
  https://your-api.com/api/v1/monitoring/performance

# Get alerts
curl -H "X-API-Key: your-key" \
  https://your-api.com/api/v1/monitoring/alerts
```

## Log Structure

### Log Format

```json
{
  "timestamp": "2024-01-01 12:00:00.123",
  "level": "INFO",
  "message": "Request completed successfully",
  "requestId": "req_1704067200000_abc123",
  "method": "POST",
  "path": "/api/v1/translate",
  "statusCode": 200,
  "duration": 234,
  "ip": "192.168.1.1",
  "apiKeyId": "key_123",
  "service": "ytu-api",
  "environment": "production"
}
```

### Log Files

- **error-YYYY-MM-DD.log**: Error level logs only
- **combined-YYYY-MM-DD.log**: All log levels
- **requests-YYYY-MM-DD.log**: Request/response logs
- **exceptions-YYYY-MM-DD.log**: Uncaught exceptions
- **rejections-YYYY-MM-DD.log**: Unhandled promise rejections

## Performance Monitoring

### Metrics Tracked

- Response times (avg, min, max, p50, p95, p99)
- Success/error rates
- Request counts per endpoint
- API key usage statistics

### Accessing Metrics

```bash
# All endpoints
GET /api/v1/monitoring/performance

# Specific endpoint
GET /api/v1/monitoring/performance?endpoint=/api/v1/translate

# Custom time window (milliseconds)
GET /api/v1/monitoring/performance?timeWindow=1800000
```

## Alert System

### Alert Types

1. **HIGH_ERROR_RATE**: Error rate > 10%
2. **SLOW_RESPONSE_TIME**: p95 > 2 seconds
3. **RATE_LIMIT_ABUSE**: Rate limit violations
4. **HIGH_ERROR_COUNT**: > 50 errors in 5 minutes

### Viewing Alerts

```bash
# Recent alerts
GET /api/v1/monitoring/alerts

# By severity
GET /api/v1/monitoring/alerts?severity=high

# By type
GET /api/v1/monitoring/alerts?type=HIGH_ERROR_RATE
```

## Request Tracing

Every request gets a unique request ID:

```
req_1704067200000_abc123
```

Use this ID to trace requests across logs:

```bash
grep "req_1704067200000_abc123" logs/*.log
```

## Configuration

### Environment Variables

```bash
# Log directory
LOG_DIR=/var/log/ytu-api

# Enable file logging in development
LOG_TO_FILE=true

# Log level
LOG_LEVEL=info
```

### Alert Thresholds

Configure in code:

```typescript
import { alertService } from './services/alert.service';

alertService.updateConfig({
  highErrorRateThreshold: 0.15, // 15%
  slowResponseTimeThreshold: 3000, // 3 seconds
});
```

## Best Practices

1. **Monitor Error Rates**: Set up alerts for > 10% error rate
2. **Track Performance**: Monitor p95 and p99 response times
3. **Review Logs**: Check logs daily for patterns
4. **Use Request IDs**: Include in error reports
5. **Set Log Levels**: Use appropriate levels for environment
6. **Rotate Logs**: Ensure rotation is working
7. **Monitor Disk**: Check disk space regularly

## Integration

- **Sentry**: Critical/high alerts sent to Sentry
- **Performance Monitor**: Automatic performance tracking
- **Request Logger**: Automatic request/response logging
- **Error Handler**: Automatic error logging with stack traces

## Troubleshooting

### Logs Not Appearing

1. Check `LOG_DIR` is writable
2. Verify `LOG_TO_FILE` is set
3. Check disk space
4. Review file permissions

### High Memory Usage

1. Reduce metrics retention
2. Increase cleanup frequency
3. Reduce log retention

## API Endpoints

- `GET /api/v1/monitoring/performance` - Performance statistics
- `GET /api/v1/monitoring/alerts` - Recent alerts
- `GET /api/v1/metrics/usage` - API key usage

For detailed documentation, see `src/services/MONITORING.md`.
