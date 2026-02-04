# Pricing Plans & Features

Complete pricing plan documentation for the Y TU API.

## Plan Comparison

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| **Price** | Free | $9/month | $49/month | Custom |
| **Requests/Day** | 100 | 1,000 | 10,000 | Unlimited |
| **Requests/Minute** | 10 | 50 | 200 | Unlimited |
| **Translation** | ✓ | ✓ | ✓ | ✓ |
| **Tone Analysis** | ✓ | ✓ | ✓ | ✓ |
| **Response Generation** | ✗ | ✓ | ✓ | ✓ |
| **Full Processing** | ✗ | ✓ | ✓ | ✓ |
| **Priority Processing** | ✗ | ✗ | ✓ | ✓ |
| **Advanced Features** | ✗ | ✗ | ✓ | ✓ |
| **Custom Models** | ✗ | ✗ | ✗ | ✓ |
| **Webhooks** | ✗ | ✗ | ✓ | ✓ |
| **Analytics** | ✗ | ✓ | ✓ | ✓ |
| **SLA Guarantee** | ✗ | ✗ | ✓ | ✓ |
| **Support** | Community | Email | Priority | Dedicated |
| **Avg Response Time** | < 1s | < 800ms | < 500ms | < 300ms |

## Free Plan

**Perfect for**: Testing, development, small personal projects

### Features
- ✅ 100 requests per day
- ✅ 10 requests per minute
- ✅ Translation (50+ languages)
- ✅ Tone Analysis
- ✅ Language Detection
- ✅ Community Support

### Use Cases
- Testing and development
- Learning and experimentation
- Proof of concept
- Small personal projects

### Example Usage

```bash
# Translation
curl -X POST https://api.yutu.com/api/v1/translate \
  -H "X-RapidAPI-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "targetLanguage": "es"
  }'

# Tone Analysis
curl -X POST https://api.yutu.com/api/v1/analyze-tone \
  -H "X-RapidAPI-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I am very satisfied with your service!",
    "language": "en"
  }'
```

## Starter Plan

**Perfect for**: Small businesses, startups, MVPs

### Features
- ✅ 1,000 requests per day
- ✅ 50 requests per minute
- ✅ All Free features
- ✅ Response Generation
- ✅ Full Processing Pipeline
- ✅ Analytics Dashboard
- ✅ Email Support

### Use Cases
- Small business customer service
- Startup MVP
- Content localization
- Email automation

### Example Usage

```bash
# Full Processing Pipeline
curl -X POST https://api.yutu.com/api/v1/process \
  -H "X-RapidAPI-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I need help with my order",
    "sourceLanguage": "en",
    "targetLanguage": "es",
    "context": "E-commerce support",
    "options": {
      "translate": true,
      "analyzeTone": true,
      "generateResponse": true
    }
  }'

# Response Generation
curl -X POST https://api.yutu.com/api/v1/generate-response \
  -H "X-RapidAPI-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "originalText": "When will my order arrive?",
    "context": "E-commerce inquiry",
    "tone": "professional",
    "language": "en"
  }'
```

## Pro Plan

**Perfect for**: Growing businesses, high-volume applications

### Features
- ✅ 10,000 requests per day
- ✅ 200 requests per minute
- ✅ 10 requests per second
- ✅ All Starter features
- ✅ Priority Processing
- ✅ Advanced Features
- ✅ Webhooks
- ✅ Custom Integrations
- ✅ SLA Guarantee
- ✅ Priority Support

### Use Cases
- Enterprise customer service
- High-volume content processing
- Multi-language support systems
- Advanced AI applications

### Example Usage

```bash
# High-Volume Translation with Priority
curl -X POST https://api.yutu.com/api/v1/translate \
  -H "X-RapidAPI-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to our platform. We are excited to have you!",
    "targetLanguage": "fr",
    "sourceLanguage": "en",
    "priority": true
  }'

# Advanced Tone Analysis
curl -X POST https://api.yutu.com/api/v1/analyze-tone \
  -H "X-RapidAPI-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This product exceeded my expectations in every way!",
    "language": "en",
    "context": "Product review with cultural context",
    "advanced": true
  }'
```

## Enterprise Plan

**Perfect for**: Large organizations, mission-critical systems

### Features
- ✅ Unlimited requests
- ✅ All Pro features
- ✅ Custom AI Models
- ✅ Dedicated Support
- ✅ SLA Guarantee (99.9% uptime)
- ✅ Custom Integrations
- ✅ White-label Options
- ✅ On-premise Deployment (optional)

### Use Cases
- Large-scale enterprise applications
- Mission-critical systems
- Custom AI model training
- White-label solutions

### Example Usage

```bash
# Enterprise Integration with Custom Model
curl -X POST https://api.yutu.com/api/v1/generate-response \
  -H "X-RapidAPI-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "originalText": "Enterprise customer inquiry",
    "context": "Custom business context",
    "tone": "professional",
    "language": "en",
    "customModel": "enterprise-model-v1"
  }'

# Full Processing with Enterprise Features
curl -X POST https://api.yutu.com/api/v1/process \
  -H "X-RapidAPI-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Enterprise message requiring high-quality translation",
    "sourceLanguage": "en",
    "targetLanguage": "ja",
    "context": "Enterprise customer communication",
    "options": {
      "translate": true,
      "analyzeTone": true,
      "generateResponse": true,
      "useCustomModel": true
    }
  }'
```

## Feature Details

### Translation
- **Supported Languages**: 50+ (Free), 100+ (Starter), 150+ (Pro), 200+ (Enterprise)
- **Quality**: High accuracy with confidence scores
- **Speed**: < 1s (Free), < 800ms (Starter), < 500ms (Pro), < 300ms (Enterprise)

### Tone Analysis
- **Metrics**: Formality, emotion, urgency, intent
- **Human-likeness Score**: 0-100 scale
- **Cultural Context**: Available in Pro and Enterprise

### Response Generation
- **Candidates**: 3-5 response options
- **Scoring**: Human-likeness, appropriateness, clarity
- **Styles**: Professional, casual, friendly, formal, creative, empathetic

### Full Processing
- **Pipeline**: Translation → Tone Analysis → Response Generation
- **Options**: Enable/disable individual steps
- **Efficiency**: Single request for multiple operations

## Upgrading Plans

### From Free to Starter
- Unlock Response Generation
- 10x request limit increase
- Access to Full Processing
- Email support

### From Starter to Pro
- 10x request limit increase
- Priority processing
- Advanced features
- Webhooks and integrations
- SLA guarantee

### From Pro to Enterprise
- Unlimited requests
- Custom AI models
- Dedicated support
- Enhanced SLA
- Custom integrations

## API Endpoints

### Get Pricing Information

```bash
# All plans
GET /api/v1/pricing

# Specific plan
GET /api/v1/pricing/FREE
GET /api/v1/pricing/STARTER
GET /api/v1/pricing/PRO
GET /api/v1/pricing/ENTERPRISE
```

## Rate Limits

Rate limits are enforced per tier and reset daily:

- **Free**: 100/day, 10/minute
- **Starter**: 1,000/day, 50/minute
- **Pro**: 10,000/day, 200/minute, 10/second
- **Enterprise**: Unlimited

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Tier`: Current tier

## Support Levels

- **Community**: Forum and documentation
- **Email**: Email support with 48-hour response
- **Priority**: Email support with 24-hour response
- **Dedicated**: Dedicated support team, 4-hour response, phone support

## SLA Guarantees

- **Pro**: 99.5% uptime, < 2s response time (p95)
- **Enterprise**: 99.9% uptime, < 1s response time (p95)

## Contact

For pricing questions or Enterprise inquiries:
- Email: sales@ytu-api.com
- Website: https://ytu-api.com/pricing
- API Docs: `/api/v1/docs`
