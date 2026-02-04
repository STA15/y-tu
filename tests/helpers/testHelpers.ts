import { Request, Response } from 'express';
import { ApiKeyRequest } from '../../src/middleware/apiKeyAuth';
import { AuthRequest } from '../../src/middleware/authentication';
import { ApiKey, ApiKeyTier } from '../../src/models/apiKey.model';

/**
 * Create a mock Express request
 */
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    method: 'GET',
    path: '/',
    ip: '127.0.0.1',
    ...overrides,
  } as Partial<Request>;
};

/**
 * Create a mock Express response
 */
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    locals: {},
  };
  return res;
};

/**
 * Create a mock NextFunction
 */
export const createMockNext = (): jest.Mock => {
  return jest.fn();
};

/**
 * Create a mock API key request
 */
export const createMockApiKeyRequest = (
  apiKey?: Partial<ApiKey>,
  overrides: Partial<ApiKeyRequest> = {}
): Partial<ApiKeyRequest> => {
  const defaultApiKey: ApiKey = {
    id: 'test-api-key-id',
    key: 'ytu_test_key_1234567890',
    userId: 'test-user-id',
    tier: ApiKeyTier.FREE,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    name: 'Test API Key',
    ...apiKey,
  };

  return {
    ...createMockRequest(overrides),
    apiKey: defaultApiKey,
    user: {
      id: defaultApiKey.userId,
      tier: defaultApiKey.tier,
      apiKeyId: defaultApiKey.id,
    },
  } as Partial<ApiKeyRequest>;
};

/**
 * Create a mock authenticated request
 */
export const createMockAuthRequest = (
  user?: Partial<AuthRequest['user']>,
  overrides: Partial<AuthRequest> = {}
): Partial<AuthRequest> => {
  return {
    ...createMockRequest(overrides),
    user: {
      id: 'test-user-id',
      tier: ApiKeyTier.FREE,
      ...user,
    },
  } as Partial<AuthRequest>;
};

/**
 * Wait for a specified amount of time
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Create a test API key
 */
export const createTestApiKey = (overrides: Partial<ApiKey> = {}): ApiKey => {
  return {
    id: `test-key-${Date.now()}`,
    key: `ytu_test_${Math.random().toString(36).substring(7)}`,
    userId: 'test-user-id',
    tier: ApiKeyTier.FREE,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    name: 'Test API Key',
    ...overrides,
  };
};

/**
 * Mock external API responses
 */
export const mockTranslationResponse = {
  translatedText: 'Hola, mundo!',
  sourceLanguage: 'en',
  targetLanguage: 'es',
  confidence: 0.95,
};

export const mockToneAnalysisResponse = {
  toneScore: 85,
  formality: 7,
  emotion: 'positive',
  urgency: 'low',
  intent: 'question',
  detailedAnalysis: {
    naturalness: 90,
    contextRelevance: 85,
    emotionalAppropriateness: 80,
    culturalAppropriateness: 85,
  },
  suggestions: ['Consider adding more context', 'Use more formal language'],
  timestamp: new Date().toISOString(),
};

export const mockResponseGenerationResponse = {
  response: 'Thank you for your inquiry. We will get back to you soon.',
  score: 88,
  alternatives: [
    { text: 'We appreciate your message and will respond shortly.', score: 85 },
    { text: 'Thanks for reaching out! We\'ll be in touch soon.', score: 82 },
  ],
  language: 'en',
  metadata: {
    totalCandidates: 3,
    generationTime: 1234,
    model: 'gpt-4',
  },
  timestamp: new Date().toISOString(),
};
