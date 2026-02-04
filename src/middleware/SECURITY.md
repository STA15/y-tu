# Security Middleware Documentation

## Overview

The Y TU API implements comprehensive security measures to protect against common attacks and ensure secure operation.

## Security Layers

### 1. Request Logging
**File**: `requestLogger.ts`

- Logs all incoming requests with redacted sensitive data
- Tracks request duration and response status
- Redacts passwords, tokens, API keys, and other sensitive fields
- Provides audit trail for security monitoring

**Sensitive Fields Redacted**:
- password, token, apiKey, authorization
- secret, privateKey, accessToken, refreshToken
- creditCard, ssn, socialSecurityNumber

### 2. Security Headers (Helmet)
**File**: `securityHeaders.ts`

Implements comprehensive security headers:

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Strict-Transport-Security (HSTS)**: Enforces HTTPS
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### 3. CORS Configuration
**File**: `index.ts`

- Whitelist-based origin control
- Configurable allowed methods and headers
- Credential support for authenticated requests

### 4. Request Sanitization
**File**: `requestSanitization.ts`

Prevents injection attacks:

- **SQL Injection**: Detects and blocks SQL injection patterns
- **XSS**: Prevents cross-site scripting attacks
- **NoSQL Injection**: Protects against MongoDB/NoSQL injection
- Removes null bytes and control characters

**Patterns Detected**:
- SQL: SELECT, INSERT, UPDATE, DELETE, DROP, UNION, etc.
- XSS: `<script>`, `javascript:`, event handlers, etc.
- NoSQL: `$where`, `$ne`, `$gt`, `$regex`, etc.

### 5. Rate Limiting (Token Bucket Algorithm)
**File**: `tokenBucketRateLimiter.ts`

Implements Token Bucket algorithm for rate limiting:

- **Global**: 100 requests per minute
- **Per-IP**: 50 requests per minute
- **Throttle**: 50 requests per second

**Features**:
- Smooth rate limiting (not fixed windows)
- Automatic token refill
- Per-client tracking
- Rate limit headers in responses

### 6. Slow Down (DDoS Protection)
**File**: `slowDown.ts`

Gradually increases response time for repeated requests:

- Starts delaying after 50 requests in 15 minutes
- Adds 100ms delay per additional request
- Maximum delay of 2 seconds
- Helps prevent DDoS attacks

### 7. CSRF Protection
**File**: `csrfProtection.ts`

Protects against Cross-Site Request Forgery:

- Only applies to state-changing methods (POST, PUT, DELETE, PATCH)
- Skipped for API endpoints (API keys provide authentication)
- Uses secure, httpOnly cookies
- SameSite: strict

### 8. Legacy Rate Limiting
**File**: `rateLimiter.ts`

Additional rate limiting using express-rate-limit for backward compatibility.

## Security Headers

All responses include:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=(), ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; ...
```

## Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Tier: FREE
Retry-After: 60
```

## Error Responses

### 400 Bad Request
Invalid request data detected (sanitization failure)

### 403 Forbidden
Invalid CSRF token

### 429 Too Many Requests
Rate limit exceeded

## Configuration

Security settings can be configured via environment variables:

- `ALLOWED_ORIGINS`: CORS whitelist
- `NODE_ENV`: Environment (affects security settings)
- `RATE_LIMIT_*`: Rate limiting configuration

## Best Practices

1. **Always use HTTPS** in production
2. **Keep dependencies updated** for security patches
3. **Monitor logs** for suspicious activity
4. **Rotate API keys** regularly
5. **Use strong passwords** for authentication
6. **Implement proper error handling** to avoid information leakage

## Testing Security

### Test SQL Injection Protection
```bash
curl -X POST http://localhost:3000/api/v1/translate \
  -H "X-API-Key: your-key" \
  -d '{"text": "'; DROP TABLE users; --", "targetLanguage": "es"}'
```

### Test XSS Protection
```bash
curl -X POST http://localhost:3000/api/v1/translate \
  -H "X-API-Key: your-key" \
  -d '{"text": "<script>alert(\"XSS\")</script>", "targetLanguage": "es"}'
```

### Test Rate Limiting
```bash
# Make 101 requests quickly
for i in {1..101}; do
  curl -X GET http://localhost:3000/health
done
```

## Security Checklist

- [x] Request sanitization
- [x] SQL injection prevention
- [x] XSS protection
- [x] NoSQL injection prevention
- [x] CSRF protection
- [x] Rate limiting (Token Bucket)
- [x] DDoS protection (slow down)
- [x] Security headers (CSP, HSTS, etc.)
- [x] Request logging with redaction
- [x] CORS whitelist
- [x] Secure cookie configuration
