# Translation Service Documentation

## Overview

The translation service provides comprehensive translation capabilities with caching, retry logic, and support for multiple translation providers.

## Features

- **Multiple Providers**: Google Translate API and OpenAI (extensible)
- **Caching**: In-memory caching with node-cache (24-hour TTL)
- **Retry Logic**: Exponential backoff for API failures
- **Error Handling**: Comprehensive error handling for all scenarios
- **Language Detection**: Automatic language detection
- **Supported Languages**: Get list of supported languages

## API Methods

### 1. translate(text, sourceLang, targetLang)

Translates text from source language to target language.

**Parameters:**
- `text`: string (required, max 5000 chars)
- `targetLanguage`: string (required, ISO 639-1 code)
- `sourceLanguage`: string (optional, ISO 639-1 code)

**Response:**
```typescript
{
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  timestamp: string;
}
```

**Example:**
```typescript
const result = await translationService.translate({
  text: "Hello, world!",
  targetLanguage: "es",
  sourceLanguage: "en"
});
```

### 2. detectLanguage(text)

Detects the language of the given text.

**Parameters:**
- `text`: string (required, max 5000 chars)

**Response:**
```typescript
{
  language: string; // ISO 639-1 code
  confidence: number; // 0-1
}
```

**Example:**
```typescript
const result = await translationService.detectLanguage("Bonjour le monde");
// Returns: { language: "fr", confidence: 0.95 }
```

### 3. getSupportedLanguages()

Returns list of all supported languages.

**Response:**
```typescript
Array<{
  code: string; // ISO 639-1 code
  name: string; // Language name
}>
```

**Example:**
```typescript
const languages = await translationService.getSupportedLanguages();
// Returns: [{ code: "en", name: "English" }, ...]
```

## Caching

The service implements intelligent caching:

- **Translation Cache**: 24-hour TTL
- **Language Detection Cache**: 24-hour TTL
- **Supported Languages Cache**: 7-day TTL
- **Cache Key**: Based on text hash, source, and target language

### Cache Management

```typescript
// Clear all cache
translationService.clearCache();

// Get cache statistics
const stats = translationService.getCacheStats();
// Returns: { keys: number, hits: number, misses: number }
```

## Retry Logic

The service implements exponential backoff retry:

- **Max Retries**: 3 attempts
- **Initial Delay**: 1 second
- **Max Delay**: 10 seconds
- **Backoff Multiplier**: 2x

**Retryable Errors:**
- Network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND)
- HTTP 5xx errors
- HTTP 429 (rate limit)
- Timeout errors

## Error Handling

### Text Length Validation
- **Error**: `Text exceeds maximum length of 5000 characters`
- **Status**: 400 Bad Request

### Unsupported Language
- **Error**: `Unsupported target language: xx. Supported languages: en, es, ...`
- **Status**: 400 Bad Request

### API Failures
- **Error**: `Translation API error: [error message]`
- **Status**: 500 Internal Server Error
- **Retry**: Automatic with exponential backoff

### Empty Text
- **Error**: `Text cannot be empty`
- **Status**: 400 Bad Request

## Configuration

### Environment Variables

```env
# Translation Provider (google or openai)
TRANSLATION_PROVIDER=google

# Google Translate API Key
GOOGLE_TRANSLATE_API_KEY=your-api-key
# or
TRANSLATION_SERVICE_API_KEY=your-api-key

# OpenAI API Key (if using OpenAI)
OPENAI_API_KEY=your-api-key
```

### Supported Providers

1. **Google Translate** (default)
   - Requires: `GOOGLE_TRANSLATE_API_KEY` or `TRANSLATION_SERVICE_API_KEY`
   - Supports: 100+ languages
   - Free tier: 500,000 characters/month

2. **OpenAI** (alternative)
   - Requires: `OPENAI_API_KEY`
   - Supports: All languages
   - Uses GPT models for translation

## API Endpoints

### POST /api/v1/translate
Translate text from one language to another.

### POST /api/v1/languages/detect
Detect the language of text.

### GET /api/v1/languages
Get list of supported languages.

## Usage Examples

### Basic Translation
```bash
curl -X POST http://localhost:3000/api/v1/translate \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "targetLanguage": "es"
  }'
```

### Language Detection
```bash
curl -X POST http://localhost:3000/api/v1/languages/detect \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bonjour le monde"
  }'
```

### Get Supported Languages
```bash
curl -X GET http://localhost:3000/api/v1/languages \
  -H "X-API-Key: your-key"
```

## Performance

- **Cache Hit Rate**: Typically 60-80% for common translations
- **Average Response Time**: 
  - Cache hit: < 10ms
  - Cache miss: 200-500ms (depending on API)
- **Retry Overhead**: Adds 1-10 seconds on failures

## Best Practices

1. **Use Caching**: Common translations are cached automatically
2. **Specify Source Language**: Improves accuracy and performance
3. **Handle Errors**: Always handle API failures gracefully
4. **Monitor Cache**: Check cache statistics regularly
5. **Rate Limiting**: Respect API rate limits

## Limitations

- **Text Length**: Maximum 5000 characters per request
- **Cache Size**: Limited by available memory
- **API Quotas**: Subject to provider rate limits
- **Supported Languages**: Varies by provider
