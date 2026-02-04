# Controllers Documentation

## Overview

All controllers extend `BaseController` which provides common functionality:
- Request/response logging
- Usage metrics tracking
- Standardized error handling
- Consistent response format

## Controller Architecture

### Base Controller

All controllers extend `BaseController` which provides:
- `execute()` method: Wraps handler with logging and metrics
- Automatic request logging
- Usage metrics tracking per API key
- Error handling and logging
- Standardized response format

### Response Format

All controllers return standardized responses:

**Success:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "details": { /* optional details */ }
  }
}
```

## Controllers

### 1. TranslationController

**Methods:**
- `translateText()` - Translate text between languages
- `detectLanguage()` - Detect language of text
- `getSupportedLanguages()` - Get list of supported languages

**Features:**
- Language support validation
- Comprehensive error handling
- Request/response logging
- Usage metrics tracking

**Endpoint:** `POST /api/v1/translate`

### 2. ToneAnalysisController

**Methods:**
- `analyzeTone()` - Comprehensive AI-powered tone analysis

**Features:**
- Language validation (with auto-detection fallback)
- Tone analysis with suggestions
- Request/response logging
- Usage metrics tracking

**Endpoint:** `POST /api/v1/analyze-tone`

### 3. ResponseController

**Methods:**
- `generateResponse()` - Generate AI-powered responses

**Features:**
- Automatic tone analysis integration
- Quality checks on generated responses
- Multiple candidate generation
- Response scoring
- Request/response logging
- Usage metrics tracking

**Endpoint:** `POST /api/v1/generate-response`

### 4. ProcessController

**Methods:**
- `processMessage()` - Full pipeline processing

**Pipeline Steps:**
1. Language detection (if source language not provided)
2. Translation (if target language provided)
3. Tone analysis (default: enabled)
4. Response generation (optional)

**Features:**
- Full pipeline execution
- Graceful error handling (continues on non-critical errors)
- Comprehensive result with all steps
- Pipeline timing metrics
- Request/response logging
- Usage metrics tracking

**Endpoint:** `POST /api/v1/process`

## Usage Metrics

All controllers automatically track usage metrics per API key:

- Request count
- Success/failure rates
- Average response time
- Endpoint usage statistics
- Request metadata (text length, language, scores, etc.)

**Metrics Endpoint:** `GET /api/v1/metrics/usage`

## Logging

All controllers log:
- Incoming requests (endpoint, API key, user, IP, user agent)
- Successful responses (response time, status)
- Errors (error message, status code, stack trace in dev)

## Error Handling

All controllers use try-catch with:
- AppError for known errors (with status codes)
- Generic error handling for unexpected errors
- Proper error logging
- Standardized error responses

## Request Flow

1. **Authentication** - API key or Bearer token validation
2. **Rate Limiting** - Tiered rate limiting per API key
3. **Validation** - Input validation with express-validator
4. **Controller** - Business logic execution
5. **Logging** - Request/response logging
6. **Metrics** - Usage metrics tracking
7. **Response** - Standardized response format

## Best Practices

1. **Always use BaseController** - Extends BaseController for common functionality
2. **Log important events** - Use logger for debugging and monitoring
3. **Track metrics** - Metrics are automatically tracked via execute()
4. **Handle errors gracefully** - Use AppError for known errors
5. **Validate inputs** - Use validation middleware before controllers
6. **Return consistent format** - Use sendSuccess() helper
