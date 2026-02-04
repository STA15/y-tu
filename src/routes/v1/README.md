# API v1 Routes

This directory contains all v1 API routes following RESTful conventions.

## Route Structure

All routes are prefixed with `/api/v1`

### Endpoints

#### Health Check
- **GET** `/api/v1/health` - Health check endpoint for API monitoring

#### Translation
- **POST** `/api/v1/translate` - Translate text from one language to another
  - Requires authentication
  - Body: `{ text: string, targetLanguage: string, sourceLanguage?: string }`

#### Tone Analysis
- **POST** `/api/v1/analyze-tone` - Analyze text for human-like tone and authenticity
  - Requires authentication
  - Body: `{ text: string }`

#### Response Generation
- **POST** `/api/v1/generate-response` - Generate AI-powered responses based on prompts
  - Requires authentication
  - Body: `{ prompt: string, context?: string, tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'creative' }`

#### All-in-One Processing
- **POST** `/api/v1/process` - Combined processing (translate + analyze tone + generate response)
  - Requires authentication
  - Body: `{ text: string, targetLanguage?: string, sourceLanguage?: string, options?: { analyzeTone?: boolean, translate?: boolean, generateResponse?: boolean } }`

## Route Organization

Each endpoint has its own route file:
- `translate.routes.ts` - Translation endpoints
- `analyze-tone.routes.ts` - Tone analysis endpoints
- `generate-response.routes.ts` - Response generation endpoints
- `process.routes.ts` - All-in-one processing endpoints
- `health.routes.ts` - Health check endpoint

All routes are aggregated in `index.ts` and mounted under `/api/v1`.

## RESTful Conventions

- Use nouns, not verbs in route names
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Follow consistent naming conventions
- Group related endpoints in separate route files
