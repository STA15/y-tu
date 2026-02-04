# Y TU API - AI Translation & Tone Analysis API

A comprehensive REST API for AI-powered translation, tone analysis, and human-like response generation. Built with Express.js, TypeScript, and designed for production deployment on Vercel.

## 🚀 Features

- **Translation**: Translate text between 200+ languages with high accuracy
- **Tone Analysis**: Analyze formality, emotion, urgency, and intent
- **Response Generation**: Generate human-like responses with AI
- **Full Processing**: Combined pipeline for translation, analysis, and response generation
- **Multi-language Support**: 200+ languages supported
- **Caching**: Intelligent caching for improved performance
- **Rate Limiting**: Tiered rate limiting per API key
- **Monitoring**: Comprehensive logging and error tracking
- **Security**: Enterprise-grade security with input validation and sanitization

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Pricing Plans](#pricing-plans)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## 🏃 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- OpenAI API key (for tone analysis and response generation)
- Translation service API key (Google Translate or OpenAI)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ytu-api.git
cd ytu-api

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Build the project
npm run build

# Start the server
npm start
```

### Quick Test

```bash
# Health check
curl http://localhost:3000/health

# Translate text (requires API key)
curl -X POST http://localhost:3000/api/v1/translate \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "targetLanguage": "es"
  }'
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1
BASE_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
THROTTLE_WINDOW_MS=1000
THROTTLE_MAX_REQUESTS=50

# CORS Configuration
ALLOWED_ORIGINS=*
CORS_CREDENTIALS=false

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-in-production

# AI Services
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key
TRANSLATION_SERVICE_API_KEY=your-translation-api-key
TRANSLATION_PROVIDER=google

# Error Tracking
SENTRY_DSN=your-sentry-dsn-url

# RapidAPI (Optional)
RAPIDAPI_ENABLED=false
RAPIDAPI_PROXY_SECRET=your-rapidapi-proxy-secret
```

See `vercel.env.example` for all available options.

### Configuration Validation

The application validates all required environment variables on startup. Missing required variables will cause the application to exit with an error.

## 📚 API Documentation

### Interactive Documentation

Visit `/api/v1/docs` for interactive Swagger documentation.

### OpenAPI Specification

- JSON: `/api/v1/openapi.json`
- YAML: `/api/v1/openapi.yaml`

### Endpoints

#### Translation
- `POST /api/v1/translate` - Translate text between languages

#### Tone Analysis
- `POST /api/v1/analyze-tone` - Analyze tone and sentiment

#### Response Generation
- `POST /api/v1/generate-response` - Generate human-like responses

#### Full Processing
- `POST /api/v1/process` - Combined translation, analysis, and response

#### Utilities
- `GET /api/v1/languages` - Get supported languages
- `GET /api/v1/health` - Health check
- `GET /api/v1/pricing` - Pricing plans information
- `GET /api/v1/metrics/usage` - Usage metrics (authenticated)
- `GET /api/v1/monitoring/performance` - Performance statistics (authenticated)

## 🔐 Authentication

### API Key Authentication

Include your API key in the request header:

```bash
X-API-Key: your-api-key
```

Or as a Bearer token:

```bash
Authorization: Bearer your-api-key
```

### RapidAPI Authentication

If using RapidAPI, include RapidAPI headers:

```bash
X-RapidAPI-Key: your-rapidapi-key
X-RapidAPI-Host: your-api-host
```

### Getting an API Key

1. Create an account
2. Navigate to API Keys section
3. Generate a new API key
4. Select your pricing tier

## 💰 Pricing Plans

| Plan | Price | Requests/Day | Features |
|------|-------|--------------|----------|
| **FREE** | Free | 100 | Translation, Tone Analysis |
| **STARTER** | $9/month | 1,000 | All Free + Response Generation |
| **PRO** | $49/month | 10,000 | All Starter + Priority, Webhooks |
| **ENTERPRISE** | Custom | Unlimited | All Pro + Custom Models, SLA |

See [PRICING_PLANS.md](./PRICING_PLANS.md) for detailed feature comparison.

## 🚢 Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel login
   vercel link
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all required variables from `vercel.env.example`

3. **Deploy**
   ```bash
   vercel --prod
   ```

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for detailed instructions.

### Other Platforms

The API can be deployed to any Node.js hosting platform:
- AWS Lambda
- Google Cloud Functions
- Azure Functions
- Heroku
- DigitalOcean

## 💻 Development

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
└── utils/           # Utility functions
```

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier (recommended) for formatting

## 🧪 Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Structure

- Unit tests: `tests/utils/`, `tests/services/`
- Integration tests: `tests/routes/`, `tests/middleware/`
- Test helpers: `tests/helpers/`

See [tests/README.md](./tests/README.md) for more information.

## 📊 Monitoring

### Health Checks

```bash
# Basic health check
GET /health
GET /api/v1/health
```

### Logging

Logs are written to:
- Console (development)
- Files in `logs/` directory (production)
  - `error-YYYY-MM-DD.log` - Error logs
  - `combined-YYYY-MM-DD.log` - All logs
  - `requests-YYYY-MM-DD.log` - Request logs

### Error Tracking

Sentry integration for error tracking:
- Automatic error capture
- Performance monitoring
- Release tracking

### Performance Monitoring

Access performance metrics:
```bash
GET /api/v1/monitoring/performance
GET /api/v1/monitoring/alerts
```

See [src/services/MONITORING.md](./src/services/MONITORING.md) for details.

## 🔒 Security

### Security Features

- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ NoSQL injection prevention
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ CSRF protection
- ✅ Sensitive data redaction
- ✅ No stack traces in production

### Security Best Practices

1. **API Keys**: Keep API keys secure, never commit to version control
2. **Environment Variables**: Use secure storage for secrets
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Configure appropriate rate limits
5. **Input Validation**: Always validate and sanitize inputs
6. **Error Handling**: Don't expose sensitive information in errors

See [src/middleware/SECURITY.md](./src/middleware/SECURITY.md) for more details.

## 📝 API Usage Examples

### Translation

```javascript
const response = await fetch('https://api.yutu.com/api/v1/translate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Hello, world!',
    targetLanguage: 'es',
    sourceLanguage: 'en'
  })
});

const data = await response.json();
console.log(data.data.translatedText);
```

### Tone Analysis

```javascript
const response = await fetch('https://api.yutu.com/api/v1/analyze-tone', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'I am very satisfied with your service!',
    language: 'en',
    context: 'Customer feedback'
  })
});
```

### Full Processing

```javascript
const response = await fetch('https://api.yutu.com/api/v1/process', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Customer inquiry',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    context: 'Customer service',
    options: {
      translate: true,
      analyzeTone: true,
      generateResponse: true
    }
  })
});
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🆘 Support

- **Documentation**: `/api/v1/docs`
- **Issues**: GitHub Issues
- **Email**: support@ytu-api.com
- **Status**: [Status Page](https://status.yutu.com)

## 🔗 Links

- [API Documentation](./src/config/API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Vercel Setup](./VERCEL_SETUP.md)
- [RapidAPI Setup](./RAPIDAPI_SETUP.md)
- [Pricing Plans](./PRICING_PLANS.md)
- [Pre-Launch Checklist](./PRE_LAUNCH_CHECKLIST.md)

## 📈 Roadmap

- [ ] Database integration
- [ ] Webhook support
- [ ] Custom AI models
- [ ] Batch processing
- [ ] Real-time streaming
- [ ] Additional language support

---

**Made with ❤️ for developers**
