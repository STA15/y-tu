# RapidAPI Marketplace Setup Guide

Complete guide for publishing the Y TU API on RapidAPI marketplace.

## Overview

The Y TU API is configured to work seamlessly with RapidAPI, supporting both direct API key authentication and RapidAPI proxy authentication.

## Authentication Methods

### 1. RapidAPI Proxy Authentication (Recommended)

RapidAPI automatically adds headers to requests:
- `X-RapidAPI-Proxy-Secret`: Secret key for validation
- `X-RapidAPI-User`: RapidAPI user ID
- `X-RapidAPI-Subscription`: Subscription plan (free, basic, pro, enterprise, mega, ultra)

### 2. Direct API Key Authentication

Users can also use direct API keys:
- `X-API-Key`: Your API key
- `Authorization: Bearer your-api-key`

## Configuration

### Environment Variables

Add to your Vercel/environment:

```bash
# Enable RapidAPI support
RAPIDAPI_ENABLED=true

# RapidAPI proxy secret (provided by RapidAPI)
RAPIDAPI_PROXY_SECRET=your-rapidapi-proxy-secret
```

### Plan Mapping

RapidAPI plans are automatically mapped to internal tiers:

| RapidAPI Plan | Internal Tier | Requests/Day |
|--------------|---------------|--------------|
| free         | FREE          | 100          |
| basic        | STARTER       | 1,000        |
| pro          | PRO           | 10,000       |
| enterprise   | ENTERPRISE    | Unlimited    |
| mega         | ENTERPRISE    | Unlimited    |
| ultra        | ENTERPRISE    | Unlimited    |

## Publishing on RapidAPI

### Step 1: Create API on RapidAPI

1. Go to [RapidAPI Provider Dashboard](https://rapidapi.com/provider/dashboard)
2. Click **Add New API**
3. Fill in API details:
   - **Name**: Y TU API - AI Translation & Tone Analysis
   - **Description**: AI-powered translation, tone analysis, and response generation
   - **Category**: Translation, AI/ML
   - **Base URL**: Your API URL (e.g., `https://your-api.vercel.app`)

### Step 2: Upload OpenAPI Specification

1. Export OpenAPI spec:
   ```bash
   curl https://your-api.vercel.app/api/v1/openapi.json > openapi.json
   ```

2. Upload to RapidAPI:
   - Go to **API Settings** → **OpenAPI**
   - Upload `openapi.json`
   - RapidAPI will auto-generate endpoints

### Step 3: Configure Pricing Plans

Set up plans in RapidAPI dashboard:

#### Free Plan
- **Price**: Free
- **Requests**: 100/day
- **Features**: Translation, Tone Analysis, Language Detection

#### Basic Plan
- **Price**: $9/month
- **Requests**: 1,000/day
- **Features**: All Free features + Response Generation, Full Processing

#### Pro Plan
- **Price**: $49/month
- **Requests**: 10,000/day
- **Features**: All Basic features + Priority Processing, Advanced Features, Webhooks

#### Enterprise Plan
- **Price**: Custom
- **Requests**: Unlimited
- **Features**: All Pro features + Custom Models, Dedicated Support, SLA

### Step 4: Get Proxy Secret

1. Go to **API Settings** → **Security**
2. Copy the **Proxy Secret**
3. Add to environment variables:
   ```bash
   RAPIDAPI_PROXY_SECRET=your-proxy-secret-here
   ```

### Step 5: Test Integration

Test with RapidAPI headers:

```bash
curl -X POST https://your-api.rapidapi.com/api/v1/translate \
  -H "X-RapidAPI-Key: test-key" \
  -H "X-RapidAPI-Host: your-api.rapidapi.com" \
  -H "X-RapidAPI-Proxy-Secret: your-proxy-secret" \
  -H "X-RapidAPI-User: test-user" \
  -H "X-RapidAPI-Subscription: free" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "targetLanguage": "es",
    "sourceLanguage": "en"
  }'
```

## API Endpoints

All endpoints work with RapidAPI:

- `POST /api/v1/translate` - Translation
- `POST /api/v1/analyze-tone` - Tone Analysis
- `POST /api/v1/generate-response` - Response Generation
- `POST /api/v1/process` - Full Processing
- `GET /api/v1/languages` - Supported Languages
- `GET /api/v1/pricing` - Pricing Plans

## Rate Limiting

Rate limits are enforced per RapidAPI subscription tier:

- **Free**: 100 requests/day, 10 requests/minute
- **Basic**: 1,000 requests/day, 50 requests/minute
- **Pro**: 10,000 requests/day, 200 requests/minute, 10 requests/second
- **Enterprise**: Unlimited

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Tier`: Current tier

## Usage Examples

### Free Tier Example

```javascript
const axios = require('axios');

const response = await axios.post(
  'https://yutu-api.p.rapidapi.com/api/v1/translate',
  {
    text: 'Hello, how can I help you?',
    targetLanguage: 'es',
    sourceLanguage: 'en'
  },
  {
    headers: {
      'X-RapidAPI-Key': 'your-rapidapi-key',
      'X-RapidAPI-Host': 'yutu-api.p.rapidapi.com',
      'Content-Type': 'application/json'
    }
  }
);
```

### Pro Tier Example

```javascript
// Full processing pipeline with priority
const response = await axios.post(
  'https://yutu-api.p.rapidapi.com/api/v1/process',
  {
    text: 'Customer inquiry requiring immediate response',
    sourceLanguage: 'en',
    targetLanguage: 'fr',
    context: 'Customer service',
    options: {
      translate: true,
      analyzeTone: true,
      generateResponse: true
    }
  },
  {
    headers: {
      'X-RapidAPI-Key': 'your-rapidapi-key',
      'X-RapidAPI-Host': 'yutu-api.p.rapidapi.com',
      'Content-Type': 'application/json'
    }
  }
);
```

## Feature Matrix

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| Translation | ✓ | ✓ | ✓ | ✓ |
| Tone Analysis | ✓ | ✓ | ✓ | ✓ |
| Response Generation | ✗ | ✓ | ✓ | ✓ |
| Full Processing | ✗ | ✓ | ✓ | ✓ |
| Priority Processing | ✗ | ✗ | ✓ | ✓ |
| Advanced Features | ✗ | ✗ | ✓ | ✓ |
| Custom Models | ✗ | ✗ | ✗ | ✓ |
| Webhooks | ✗ | ✗ | ✓ | ✓ |
| Analytics | ✗ | ✓ | ✓ | ✓ |
| SLA | ✗ | ✗ | ✓ | ✓ |
| Dedicated Support | ✗ | ✗ | ✗ | ✓ |

## Monitoring

### RapidAPI Analytics

- View usage in RapidAPI dashboard
- Monitor request counts per plan
- Track revenue and subscriptions

### API Monitoring

- Use `/api/v1/monitoring/performance` for performance stats
- Use `/api/v1/monitoring/alerts` for alerts
- Check logs for RapidAPI requests

## Best Practices

1. **Validate Proxy Secret**: Always validate `X-RapidAPI-Proxy-Secret`
2. **Log RapidAPI Requests**: Track RapidAPI usage separately
3. **Monitor Rate Limits**: Ensure limits match RapidAPI plans
4. **Handle Errors Gracefully**: Return clear error messages
5. **Document Features**: Clearly document tier differences
6. **Test All Plans**: Test with different subscription tiers

## Troubleshooting

### Invalid Proxy Secret

**Issue**: Requests fail with 401

**Solution**:
1. Verify `RAPIDAPI_PROXY_SECRET` is set correctly
2. Check RapidAPI dashboard for correct secret
3. Ensure `RAPIDAPI_ENABLED=true`

### Wrong Tier Mapping

**Issue**: Users get wrong rate limits

**Solution**:
1. Check plan mapping in `rapidapi.config.ts`
2. Verify RapidAPI subscription header
3. Review tier mapping logic

### Rate Limit Issues

**Issue**: Users hit rate limits unexpectedly

**Solution**:
1. Check RapidAPI plan limits
2. Verify tier mapping
3. Review rate limiter configuration

## Support

For RapidAPI-specific issues:
- RapidAPI Support: [support.rapidapi.com](https://support.rapidapi.com)
- API Documentation: `/api/v1/docs`
- Pricing Information: `/api/v1/pricing`
