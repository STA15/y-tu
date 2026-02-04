# AI Response Generation Service

## Overview

The response generation service uses AI (OpenAI/Claude) to generate human-like, contextually appropriate responses with multiple candidates and intelligent scoring.

## Features

- **AI-Powered Generation**: Uses OpenAI GPT-4 or Claude for natural responses
- **Multiple Candidates**: Generates 3-5 response candidates
- **Intelligent Scoring**: Scores each candidate on 4 dimensions
- **Best Response Selection**: Automatically selects highest-scoring response
- **Fallback Mechanisms**: Template-based fallback if AI fails
- **Caching**: Intelligent caching for similar requests
- **Multi-language Support**: Automatic translation if needed
- **Tone-Aware**: Uses tone analysis for better responses

## Input Parameters

### Required
- `originalMessage`: The original message to respond to (translated if needed)

### Optional
- `toneAnalysis`: Tone analysis results from the tone analysis service
- `businessContext`: Additional business context
- `targetLanguage`: ISO 639-1 language code for response
- `responseStyle`: Style preference (professional, casual, friendly, formal, creative, empathetic, concise)
- `userId`: User identifier

## Response Format

```typescript
{
  response: string; // Best response
  score: number; // 0-100 confidence score
  alternatives: Array<{
    text: string;
    score: number;
  }>; // Alternative responses (top 3)
  language: string; // Target language
  metadata: {
    totalCandidates: number;
    generationTime: number; // milliseconds
    model?: string;
  };
  timestamp: string;
}
```

## Scoring System

Each candidate is scored on 4 dimensions:

### 1. Human-likeness (35% weight)
- Natural language patterns
- Sentence structure
- Vocabulary diversity
- Based on tone analysis

### 2. Appropriateness (30% weight)
- Intent matching
- Urgency handling
- Emotion matching
- Length appropriateness

### 3. Clarity (20% weight)
- Sentence length
- Word complexity
- Clarity indicators
- Readability

### 4. Cultural Sensitivity (15% weight)
- Cultural appropriateness
- Cultural context awareness
- Based on tone analysis

## Generation Process

1. **Input Validation**: Validates original message
2. **Translation**: Translates message if target language differs
3. **Tone Analysis**: Analyzes tone if not provided
4. **Candidate Generation**: Generates 3-5 candidates using AI
5. **Scoring**: Scores each candidate on 4 dimensions
6. **Selection**: Selects best candidate based on overall score
7. **Caching**: Caches result for future use

## Fallback Mechanisms

If AI service fails, the service uses template-based fallback:

- **Intent-based Templates**: Different templates for questions, complaints, requests, feedback
- **Formality Adjustment**: Adjusts formality based on tone analysis
- **Lower Score**: Fallback responses have score of 60 (vs 70-90 for AI-generated)

## Caching

- **Cache TTL**: 6 hours
- **Cache Key**: Based on message hash, language, style, and context
- **Benefits**: Faster responses, reduced API costs

## API Endpoint

### POST /api/v1/generate-response

**Request Body:**
```json
{
  "originalText": "I need help with my order",
  "context": "Customer support",
  "tone": "professional",
  "language": "en",
  "toneAnalysis": { /* optional, auto-generated if not provided */ }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "I'd be happy to help you with your order. Could you please provide your order number?",
    "score": 87,
    "alternatives": [
      {
        "text": "Thank you for reaching out. I can assist you with your order. Please share your order details.",
        "score": 85
      },
      {
        "text": "I'm here to help with your order. What specific issue are you experiencing?",
        "score": 83
      }
    ],
    "language": "en",
    "metadata": {
      "totalCandidates": 5,
      "generationTime": 2341,
      "model": "gpt-4"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Configuration

### Environment Variables

```env
# Response Generation Provider
RESPONSE_GENERATION_PROVIDER=openai  # or claude

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo

# Claude Configuration (if using Claude)
CLAUDE_API_KEY=your-claude-api-key
```

## Usage Examples

### Basic Response Generation
```bash
curl -X POST http://localhost:3000/api/v1/generate-response \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "originalText": "When will my order arrive?",
    "context": "Customer support"
  }'
```

### With Tone Analysis
```bash
curl -X POST http://localhost:3000/api/v1/generate-response \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "originalText": "This is unacceptable!",
    "toneAnalysis": {
      "emotion": "negative",
      "urgency": "high",
      "intent": "complaint"
    }
  }'
```

### Multi-language
```bash
curl -X POST http://localhost:3000/api/v1/generate-response \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "originalText": "Necesito ayuda",
    "language": "es",
    "context": "Customer support"
  }'
```

## Best Practices

1. **Provide Context**: Include business context for better responses
2. **Include Tone Analysis**: Pre-analyze tone for better results
3. **Specify Language**: Set target language for multilingual support
4. **Review Alternatives**: Check alternative responses for better options
5. **Monitor Scores**: Track response scores over time

## Performance

- **Cache Hit**: < 10ms
- **Cache Miss**: 3-8 seconds (depending on API and number of candidates)
- **Average Response Time**: 2-5 seconds
- **Cache Hit Rate**: Typically 30-50% for similar requests

## Limitations

- **Text Length**: Maximum 5000 characters per request
- **API Quotas**: Subject to OpenAI/Claude rate limits
- **Cache Size**: Limited by available memory
- **Candidates**: Generates 3-5 candidates (configurable)

## Error Handling

- **API Failures**: Automatic fallback to template-based responses
- **Scoring Failures**: Uses default scores
- **Translation Failures**: Uses original message
- **Validation Errors**: Returns 400 Bad Request
