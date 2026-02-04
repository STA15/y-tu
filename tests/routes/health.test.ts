import request from 'supertest';
import express, { Express } from 'express';
import healthRoutes from '../../src/routes/v1/health.routes';
import { requestStartTimeMiddleware } from '../../src/utils/response';

// Mock config
jest.mock('../../src/config/config', () => ({
  config: {
    server: {
      nodeEnv: 'test',
      apiVersion: 'v1',
    },
  },
}));

describe('Health Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(requestStartTimeMiddleware);
    app.use('/health', healthRoutes);
  });

  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'ok',
          environment: 'test',
          apiVersion: 'v1',
          service: 'ytu-api',
        },
        metadata: {
          requestId: expect.any(String),
          timestamp: expect.any(String),
          processingTime: expect.any(Number),
        },
      });
    });

    it('should include uptime in response', async () => {
      const response = await request(app).get('/health');

      expect(response.body.data.uptime).toBeDefined();
      expect(typeof response.body.data.uptime).toBe('number');
    });

    it('should include timestamp in response', async () => {
      const response = await request(app).get('/health');

      expect(response.body.data.timestamp).toBeDefined();
      expect(new Date(response.body.data.timestamp).getTime()).not.toBeNaN();
    });
  });
});
