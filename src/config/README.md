# Configuration System

This directory contains the comprehensive configuration system for the Y TU API.

## Files

- `config.ts` - Main configuration file that loads and exports all config values
- `config.types.ts` - TypeScript interfaces and types for all configuration values
- `config.validator.ts` - Validation logic to ensure required environment variables are present

## Configuration Structure

### Server Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development, production, test)
- `API_VERSION` - API version (default: v1)
- `BASE_URL` - Base URL for the API

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Time window for rate limiting in milliseconds (default: 60000 = 1 minute)
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window (default: 100)
- `THROTTLE_WINDOW_MS` - Time window for throttling in milliseconds (default: 1000 = 1 second)
- `THROTTLE_MAX_REQUESTS` - Maximum requests per throttle window (default: 50)

### CORS Configuration
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `CORS_CREDENTIALS` - Enable credentials (default: true)
- `CORS_METHODS` - Allowed HTTP methods
- `CORS_ALLOWED_HEADERS` - Allowed headers

### Database Configuration
Either use a full connection string:
- `DATABASE_URL` or `DATABASE_CONNECTION_STRING`

Or use individual settings:
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_SSL`

### AI Services
- `OPENAI_API_KEY` - Required OpenAI API key
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-4)
- `TRANSLATION_SERVICE_API_KEY` - Optional translation service API key
- `TRANSLATION_SERVICE_URL` - Optional translation service URL

### JWT Configuration
- `JWT_SECRET` - Secret key for JWT signing (required, min 32 chars recommended)
- `JWT_EXPIRES_IN` - Access token expiration (default: 15m)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (default: 7d)
- `JWT_ISSUER` - Token issuer (default: ytu-api)
- `JWT_AUDIENCE` - Token audience (default: ytu-api-users)

## Usage

```typescript
import { config, isProduction, isDevelopment, getApiBasePath } from './config/config';

// Access configuration
const port = config.server.port;
const apiKey = config.aiServices.openaiApiKey;
const jwtSecret = config.jwt.secret;

// Use helper functions
if (isProduction()) {
  // Production-specific code
}

const apiPath = getApiBasePath(); // Returns "/api/v1"
```

## Validation

Configuration is automatically validated when the config module is imported. The validation:

1. Checks all required environment variables are present
2. Validates format and ranges for numeric values
3. Provides warnings for potentially insecure configurations
4. Exits the process with error messages if critical issues are found

## Environment Variables

See `.env.example` in the project root for all available environment variables and their descriptions.
