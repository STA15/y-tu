# API Key Authentication System

## Overview

The Y TU API supports API key-based authentication with tiered rate limiting. This system provides secure access control and usage management.

## Authentication Methods

### 1. API Key Header (Recommended)
```
X-API-Key: ytu_<your-api-key>
```

### 2. Bearer Token (Alternative)
```
Authorization: Bearer ytu_<your-api-key>
```

Note: Bearer tokens starting with `ytu_` are treated as API keys. Other Bearer tokens are handled as JWT tokens (for future OAuth support).

## API Key Tiers

### FREE Tier
- **Daily Limit**: 100 requests/day
- **Per Minute**: 10 requests/minute
- **Use Case**: Testing, development, low-volume applications

### STARTER Tier
- **Daily Limit**: 1,000 requests/day
- **Per Minute**: 50 requests/minute
- **Use Case**: Small applications, moderate usage

### PRO Tier
- **Daily Limit**: 10,000 requests/day
- **Per Minute**: 200 requests/minute
- **Per Second**: 10 requests/second
- **Use Case**: Production applications, high-volume usage

### ENTERPRISE Tier
- **Daily Limit**: Unlimited
- **Per Minute**: Unlimited
- **Per Second**: Unlimited
- **Use Case**: Enterprise customers, unlimited usage

## Rate Limiting

Rate limits are enforced per API key and reset daily at midnight UTC. When a rate limit is exceeded, the API returns:

- **HTTP 429 Too Many Requests**
- Headers:
  - `X-RateLimit-Limit`: Your tier's daily limit
  - `X-RateLimit-Remaining`: Remaining requests today
  - `X-RateLimit-Tier`: Your tier name
  - `Retry-After`: Seconds until reset (86400 for daily limits)

## Error Responses

### Invalid API Key (401)
```json
{
  "success": false,
  "error": {
    "message": "Invalid API key",
    "statusCode": 401
  }
}
```

### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded: Daily limit of 100 requests exceeded",
    "statusCode": 429
  }
}
```

## API Key Management

### Create API Key
```http
POST /api/v1/api-keys
Authorization: Bearer <jwt-token>

{
  "name": "My API Key",
  "tier": "STARTER"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "key_1234567890",
    "name": "My API Key",
    "tier": "STARTER",
    "key": "ytu_<full-key>",
    "keyPreview": "ytu_abcd...xyz1",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "message": "Store this API key securely. It will not be shown again."
  }
}
```

### List API Keys
```http
GET /api/v1/api-keys
Authorization: Bearer <jwt-token>
```

### Get Usage Statistics
```http
GET /api/v1/api-keys/:id/usage?date=2024-01-01
Authorization: Bearer <jwt-token>
```

### Delete API Key
```http
DELETE /api/v1/api-keys/:key
Authorization: Bearer <jwt-token>
```

## Usage Example

```bash
# Using X-API-Key header
curl -X POST https://api.example.com/api/v1/translate \
  -H "X-API-Key: ytu_your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "targetLanguage": "es"
  }'

# Using Bearer token
curl -X POST https://api.example.com/api/v1/translate \
  -H "Authorization: Bearer ytu_your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "targetLanguage": "es"
  }'
```

## Migration to Database

The current implementation uses an in-memory store. To migrate to a database:

1. Update `src/services/apiKeyStore.service.ts` to use your database
2. Implement the same interface methods
3. Add database indexes on:
   - `key` (unique)
   - `userId`
   - `tier`
   - `createdAt`

## Security Best Practices

1. **Never expose API keys** in client-side code
2. **Rotate API keys** regularly
3. **Use environment variables** to store API keys
4. **Monitor usage** through the usage statistics endpoint
5. **Deactivate unused keys** immediately
