import { SwaggerDefinition } from 'swagger-jsdoc';
import { config } from './config';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Y TU API - AI Translation and Human Tone Authentication',
    version: '1.0.0',
    description: `
# Y TU API Documentation

A comprehensive AI-powered API for translation, tone analysis, and human-like response generation.

## Features

- **Translation**: Multi-language translation with language detection
- **Tone Analysis**: AI-powered analysis of formality, emotion, urgency, and intent
- **Response Generation**: Generate human-like responses with cultural sensitivity
- **All-in-One Processing**: Combined translation, tone analysis, and response generation

## Authentication

All endpoints require API key authentication. Include your API key in one of the following ways:

- **Header**: \`X-API-Key: your-api-key\`
- **Bearer Token**: \`Authorization: Bearer your-api-key\`

## Rate Limiting

Rate limits vary by API key tier:

- **FREE**: 100 requests/day
- **STARTER**: 1,000 requests/day
- **PRO**: 10,000 requests/day
- **ENTERPRISE**: Unlimited

Rate limit information is included in response headers:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Remaining requests
- \`X-RateLimit-Tier\`: Your current tier

## Support

For support, please contact: support@ytu-api.com
    `,
    contact: {
      name: 'Y TU API Support',
      email: 'support@ytu-api.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: config.server.baseUrl 
        ? `https://${config.server.baseUrl}` 
        : `http://localhost:${config.server.port}`,
      description: config.server.nodeEnv === 'production' ? 'Production Server' : 'Development Server',
    },
    {
      url: 'https://api.yutu.com',
      description: 'Production Server (if deployed)',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check and system status endpoints',
    },
    {
      name: 'Translation',
      description: 'Text translation and language detection',
    },
    {
      name: 'Tone Analysis',
      description: 'AI-powered tone and sentiment analysis',
    },
    {
      name: 'Response Generation',
      description: 'Generate human-like responses',
    },
    {
      name: 'Process',
      description: 'All-in-one processing endpoint',
    },
    {
      name: 'Languages',
      description: 'Language detection and supported languages',
    },
    {
      name: 'API Keys',
      description: 'API key management',
    },
    {
      name: 'Metrics',
      description: 'Usage metrics and statistics',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key authentication. Get your API key from the API Keys section.',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'Bearer token authentication using your API key',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['success', 'error', 'metadata'],
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Validation failed',
              },
              details: {
                type: 'object',
                description: 'Additional error details',
              },
            },
          },
          metadata: {
            $ref: '#/components/schemas/ResponseMetadata',
          },
        },
      },
      Success: {
        type: 'object',
        required: ['success', 'data', 'metadata'],
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
          metadata: {
            $ref: '#/components/schemas/ResponseMetadata',
          },
        },
      },
      ResponseMetadata: {
        type: 'object',
        required: ['requestId', 'timestamp', 'processingTime'],
        properties: {
          requestId: {
            type: 'string',
            example: 'req_1703123456789_a1b2c3d4',
            description: 'Unique request identifier',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-12-21T10:30:45.123Z',
          },
          processingTime: {
            type: 'number',
            example: 234,
            description: 'Processing time in milliseconds',
          },
        },
      },
      TranslationRequest: {
        type: 'object',
        required: ['text', 'targetLanguage'],
        properties: {
          text: {
            type: 'string',
            maxLength: 5000,
            example: 'Hello, how can I help you today?',
            description: 'Text to translate',
          },
          targetLanguage: {
            type: 'string',
            pattern: '^[a-z]{2}$',
            example: 'es',
            description: 'Target language code (ISO 639-1)',
          },
          sourceLanguage: {
            type: 'string',
            pattern: '^[a-z]{2}$',
            example: 'en',
            description: 'Source language code (ISO 639-1). If not provided, language will be auto-detected.',
          },
        },
      },
      TranslationResponse: {
        type: 'object',
        required: ['originalText', 'translatedText', 'sourceLanguage', 'targetLanguage', 'confidence'],
        properties: {
          originalText: {
            type: 'string',
            example: 'Hello, how can I help you today?',
          },
          translatedText: {
            type: 'string',
            example: 'Hola, ¿cómo puedo ayudarte hoy?',
          },
          sourceLanguage: {
            type: 'string',
            example: 'en',
          },
          targetLanguage: {
            type: 'string',
            example: 'es',
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            example: 0.95,
            description: 'Translation confidence score',
          },
        },
      },
      ToneAnalysisRequest: {
        type: 'object',
        required: ['text'],
        properties: {
          text: {
            type: 'string',
            maxLength: 5000,
            example: 'I am extremely disappointed with the service quality.',
            description: 'Text to analyze',
          },
          language: {
            type: 'string',
            pattern: '^[a-z]{2}$',
            example: 'en',
            description: 'Language code (ISO 639-1). If not provided, will be auto-detected.',
          },
          context: {
            type: 'string',
            maxLength: 1000,
            example: 'Customer service response',
            description: 'Business context for better analysis',
          },
        },
      },
      ToneAnalysisResponse: {
        type: 'object',
        required: ['toneScore', 'formality', 'emotion', 'urgency', 'intent', 'detailedAnalysis', 'timestamp'],
        properties: {
          toneScore: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            example: 85,
            description: 'Overall human-likeness score (0-100)',
          },
          formality: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            example: 7,
            description: 'Formality level (1=casual, 10=formal)',
          },
          emotion: {
            type: 'string',
            enum: ['positive', 'neutral', 'negative', 'mixed'],
            example: 'negative',
          },
          urgency: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            example: 'high',
          },
          intent: {
            type: 'string',
            enum: ['question', 'complaint', 'request', 'feedback', 'other'],
            example: 'complaint',
          },
          detailedAnalysis: {
            type: 'object',
            properties: {
              naturalness: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                example: 90,
              },
              contextRelevance: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                example: 85,
              },
              emotionalAppropriateness: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                example: 80,
              },
              culturalAppropriateness: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                example: 85,
              },
            },
          },
          suggestions: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['Consider using more empathetic language', 'Address the concern directly'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-12-21T10:30:45.123Z',
          },
        },
      },
      GenerateResponseRequest: {
        type: 'object',
        required: ['originalText'],
        properties: {
          originalText: {
            type: 'string',
            maxLength: 5000,
            example: 'I need to return this product, it arrived damaged.',
            description: 'Original message to respond to',
          },
          toneAnalysis: {
            $ref: '#/components/schemas/ToneAnalysisResponse',
            description: 'Pre-computed tone analysis (optional)',
          },
          context: {
            type: 'string',
            maxLength: 1000,
            example: 'E-commerce customer service',
            description: 'Business context',
          },
          language: {
            type: 'string',
            pattern: '^[a-z]{2}$',
            example: 'en',
            description: 'Target language for response',
          },
          tone: {
            type: 'string',
            enum: ['professional', 'casual', 'friendly', 'formal', 'creative', 'empathetic', 'concise'],
            example: 'empathetic',
            description: 'Desired response style',
          },
        },
      },
      GenerateResponseResponse: {
        type: 'object',
        required: ['response', 'score', 'alternatives', 'language', 'metadata', 'timestamp'],
        properties: {
          response: {
            type: 'string',
            example: 'I sincerely apologize for the inconvenience. We will process your return immediately and send a replacement right away.',
            description: 'Best generated response',
          },
          score: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            example: 88,
            description: 'Confidence score (0-100)',
          },
          alternatives: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                },
                score: {
                  type: 'number',
                },
              },
            },
            example: [
              {
                text: 'We apologize for the damaged product. Your return is being processed.',
                score: 85,
              },
            ],
          },
          language: {
            type: 'string',
            example: 'en',
          },
          metadata: {
            type: 'object',
            properties: {
              totalCandidates: {
                type: 'number',
                example: 5,
              },
              generationTime: {
                type: 'number',
                example: 1234,
                description: 'Generation time in milliseconds',
              },
              model: {
                type: 'string',
                example: 'gpt-4',
              },
            },
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-12-21T10:30:45.123Z',
          },
        },
      },
      ProcessRequest: {
        type: 'object',
        required: ['text', 'targetLanguage'],
        properties: {
          text: {
            type: 'string',
            maxLength: 5000,
            example: 'I want to cancel my subscription immediately.',
          },
          sourceLanguage: {
            type: 'string',
            pattern: '^[a-z]{2}$',
            example: 'en',
          },
          targetLanguage: {
            type: 'string',
            pattern: '^[a-z]{2}$',
            example: 'es',
          },
          context: {
            type: 'string',
            maxLength: 1000,
            example: 'SaaS customer service',
          },
          options: {
            type: 'object',
            properties: {
              translate: {
                type: 'boolean',
                default: true,
              },
              analyzeTone: {
                type: 'boolean',
                default: true,
              },
              generateResponse: {
                type: 'boolean',
                default: false,
              },
            },
          },
        },
      },
      ProcessResponse: {
        type: 'object',
        required: ['originalText', 'timestamp'],
        properties: {
          originalText: {
            type: 'string',
          },
          translation: {
            $ref: '#/components/schemas/TranslationResponse',
          },
          toneAnalysis: {
            $ref: '#/components/schemas/ToneAnalysisResponse',
          },
          generatedResponse: {
            $ref: '#/components/schemas/GenerateResponseResponse',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      ApiKeyTier: {
        type: 'string',
        enum: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'],
        example: 'PRO',
      },
      ApiKeyInfo: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'key_1234567890',
          },
          name: {
            type: 'string',
            example: 'My API Key',
          },
          tier: {
            $ref: '#/components/schemas/ApiKeyTier',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          lastUsedAt: {
            type: 'string',
            format: 'date-time',
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
          keyPreview: {
            type: 'string',
            example: 'ytu_test...7890',
            description: 'Masked API key preview',
          },
        },
      },
      ApiKeyUsage: {
        type: 'object',
        properties: {
          apiKeyId: {
            type: 'string',
          },
          date: {
            type: 'string',
            format: 'date',
            example: '2023-12-21',
          },
          requestCount: {
            type: 'number',
            example: 150,
          },
          lastRequestAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required or invalid API key',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required: Missing or invalid API Key or JWT token',
              },
              metadata: {
                requestId: 'req_123',
                timestamp: '2023-12-21T10:30:45.123Z',
                processingTime: 5,
              },
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Rate limit exceeded: Daily limit of 100 requests exceeded',
              },
              metadata: {
                requestId: 'req_123',
                timestamp: '2023-12-21T10:30:45.123Z',
                processingTime: 2,
              },
            },
          },
        },
        headers: {
          'Retry-After': {
            schema: {
              type: 'integer',
              example: 86400,
            },
            description: 'Seconds to wait before retrying',
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: [
                  {
                    field: 'text',
                    message: 'Text is required',
                  },
                ],
              },
              metadata: {
                requestId: 'req_123',
                timestamp: '2023-12-21T10:30:45.123Z',
                processingTime: 10,
              },
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
    {
      BearerAuth: [],
    },
  ],
};

export default swaggerDefinition;
