# AI-Powered Tone Analysis Service

## Overview

The tone analysis service provides comprehensive AI-powered analysis of text tone, emotion, urgency, intent, and human-likeness using OpenAI or Claude AI.

## Features

- **Multi-dimensional Analysis**: Formality, emotion, urgency, intent, cultural context
- **Human-likeness Scoring**: 0-100 score based on multiple factors
- **AI-Powered**: Uses OpenAI GPT-4 or Claude for accurate analysis
- **Multi-language Support**: Automatically detects language or accepts language parameter
- **Caching**: Intelligent caching for similar inputs (12-hour TTL)
- **Retry Logic**: Exponential backoff for API failures
- **Actionable Suggestions**: Provides improvement recommendations

## Analysis Dimensions

### 1. Tone Score (0-100)
Overall human-likeness score calculated from:
- Natural language patterns (35% weight)
- Emotional appropriateness (25% weight)
- Context relevance (25% weight)
- Cultural appropriateness (15% weight)

### 2. Formality (1-10)
- 1-3: Very casual
- 4-6: Neutral
- 7-10: Very formal

### 3. Emotion
- `positive`: Positive sentiment
- `neutral`: Neutral sentiment
- `negative`: Negative sentiment
- `mixed`: Mixed emotions

### 4. Urgency
- `low`: No immediate action needed
- `medium`: Moderate urgency
- `high`: Immediate action required

### 5. Intent
- `question`: Asking a question
- `complaint`: Expressing dissatisfaction
- `request`: Making a request
- `feedback`: Providing feedback
- `statement`: Making a statement
- `other`: Other intent

### 6. Cultural Context
- Detected culture (if applicable)
- Cultural appropriateness score (0-100)
- Cultural notes

## Response Format

```typescript
{
  toneScore: number; // 0-100
  formality: number; // 1-10
  emotion: "positive" | "neutral" | "negative" | "mixed";
  urgency: "low" | "medium" | "high";
  intent: "question" | "complaint" | "request" | "feedback" | "statement" | "other";
  suggestions: string[]; // Improvement suggestions
  culturalContext?: {
    detectedCulture?: string;
    culturalAppropriateness: number;
    notes?: string;
  };
  detailedAnalysis: {
    naturalness: number; // 0-100
    emotionalAppropriateness: number; // 0-100
    contextRelevance: number; // 0-100
    culturalAppropriateness: number; // 0-100
  };
  timestamp: string;
}
```

## API Endpoint

### POST /api/v1/analyze-tone

**Request Body:**
```json
{
  "text": "I urgently need help with this issue!",
  "language": "en", // Optional, auto-detected if not provided
  "context": "Customer support ticket" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "toneScore": 75,
    "formality": 4,
    "emotion": "negative",
    "urgency": "high",
    "intent": "request",
    "suggestions": [
      "Consider using a more polite tone for requests",
      "High urgency may benefit from clearer phrasing"
    ],
    "culturalContext": {
      "culturalAppropriateness": 80,
      "notes": "Appropriate for Western business context"
    },
    "detailedAnalysis": {
      "naturalness": 85,
      "emotionalAppropriateness": 70,
      "contextRelevance": 90,
      "culturalAppropriateness": 80
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Configuration

### Environment Variables

```env
# Tone Analysis Provider
TONE_ANALYSIS_PROVIDER=openai  # or claude

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo

# Claude Configuration (if using Claude)
CLAUDE_API_KEY=your-claude-api-key
```

## Caching

The service implements intelligent caching:

- **Cache TTL**: 12 hours
- **Cache Key**: Based on text hash, language, and context
- **Cache Benefits**: 
  - Faster responses for similar inputs
  - Reduced API costs
  - Better performance

### Cache Management

```typescript
// Clear cache
toneAnalysisService.clearCache();

// Get cache statistics
const stats = toneAnalysisService.getCacheStats();
// Returns: { keys: number, hits: number, misses: number }
```

## Retry Logic

The service implements exponential backoff:

- **Max Retries**: 3 attempts
- **Initial Delay**: 1 second
- **Max Delay**: 10 seconds
- **Backoff Multiplier**: 2x

Retries on:
- Network errors
- HTTP 5xx errors
- HTTP 429 (rate limit)
- Timeout errors

## Human-likeness Scoring

The tone score (0-100) is calculated from:

1. **Naturalness (35%)**: Natural language patterns, sentence structure, vocabulary diversity
2. **Emotional Appropriateness (25%)**: Appropriate emotional tone for context
3. **Context Relevance (25%)**: How well the message fits the context
4. **Cultural Appropriateness (15%)**: Cultural sensitivity and appropriateness

### Score Interpretation

- **90-100**: Excellent human-like tone
- **70-89**: Good, minor improvements possible
- **50-69**: Needs improvement
- **0-49**: Significant improvements needed

## Multi-language Support

The service supports multiple languages:

- Automatically detects language if not provided
- Uses language context for better analysis
- Considers cultural context for different languages
- Supports all languages supported by the translation service

## Error Handling

### Text Length Validation
- **Error**: `Text exceeds maximum length of 5000 characters`
- **Status**: 400 Bad Request

### API Failures
- **Error**: `Tone analysis API error: [error message]`
- **Status**: 500 Internal Server Error
- **Retry**: Automatic with exponential backoff

### Empty Text
- **Error**: `Text cannot be empty`
- **Status**: 400 Bad Request

## Usage Examples

### Basic Analysis
```bash
curl -X POST http://localhost:3000/api/v1/analyze-tone \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I would appreciate your assistance with this matter."
  }'
```

### With Language and Context
```bash
curl -X POST http://localhost:3000/api/v1/analyze-tone \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "¡Necesito ayuda urgentemente!",
    "language": "es",
    "context": "Customer support"
  }'
```

## Best Practices

1. **Provide Context**: Include context for better analysis
2. **Specify Language**: Improves accuracy for non-English text
3. **Use Caching**: Similar texts are cached automatically
4. **Review Suggestions**: AI-generated suggestions are actionable
5. **Monitor Scores**: Track tone scores over time

## Limitations

- **Text Length**: Maximum 5000 characters per request
- **API Quotas**: Subject to OpenAI/Claude rate limits
- **Cache Size**: Limited by available memory
- **Language Support**: Best results for major languages

## Performance

- **Cache Hit**: < 10ms
- **Cache Miss**: 2-5 seconds (depending on API)
- **Average Response Time**: 1-3 seconds
- **Cache Hit Rate**: Typically 40-60% for similar inputs
