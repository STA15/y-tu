import request from 'supertest';
import express, { Express } from 'express';
import translateRoutes from '../../src/routes/v1/translate.routes';
import { translationController } from '../../src/controllers/translation.controller';
import { translationService } from '../../src/services/translation.service';
import { requestStartTimeMiddleware } from '../../src/utils/response';
import { createTestApiKey } from '../helpers/testHelpers';
import { mockTranslationResponse } from '../helpers/testHelpers';

// Mock services
jest.mock('../../src/services/translation.service', () => ({
  translationService: {
    translate: jest.fn(),
  },
}));

// Mock authentication middleware
jest.mock('../../src/middleware/authentication', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', tier: 'FREE' };
    next();
  },
}));

// Mock tiered rate limiter
jest.mock('../../src/middleware/tieredRateLimiter', () => ({
  tieredRateLimiter: (req: any, res: any, next: any) => next(),
}));

describe('Translate Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(requestStartTimeMiddleware);
    app.use('/api/v1/translate', translateRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/v1/translate', () => {
    it('should translate text successfully', async () => {
      const requestBody = {
        text: 'Hello, world!',
        targetLanguage: 'es',
        sourceLanguage: 'en',
      };

      (translationService.translate as jest.Mock).mockResolvedValue(mockTranslationResponse);

      const response = await request(app)
        .post('/api/v1/translate')
        .set('X-API-Key', createTestApiKey().key)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: mockTranslationResponse,
        metadata: {
          requestId: expect.any(String),
          timestamp: expect.any(String),
          processingTime: expect.any(Number),
        },
      });
      expect(translationService.translate).toHaveBeenCalledWith(
        expect.objectContaining({
          text: requestBody.text,
          targetLanguage: requestBody.targetLanguage,
          sourceLanguage: requestBody.sourceLanguage,
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/translate')
        .set('X-API-Key', createTestApiKey().key)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should return 400 for invalid language code', async () => {
      const response = await request(app)
        .post('/api/v1/translate')
        .set('X-API-Key', createTestApiKey().key)
        .send({
          text: 'Hello',
          targetLanguage: 'invalid',
          sourceLanguage: 'en',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 500 when translation service fails', async () => {
      (translationService.translate as jest.Mock).mockRejectedValue(
        new Error('Translation service error')
      );

      const response = await request(app)
        .post('/api/v1/translate')
        .set('X-API-Key', createTestApiKey().key)
        .send({
          text: 'Hello',
          targetLanguage: 'es',
          sourceLanguage: 'en',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .post('/api/v1/translate')
        .send({
          text: 'Hello',
          targetLanguage: 'es',
          sourceLanguage: 'en',
        });

      expect(response.status).toBe(401);
    });
  });
});
