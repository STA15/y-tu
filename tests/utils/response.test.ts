import { Request, Response } from 'express';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendRateLimitExceeded,
  sendInternalServerError,
  sendValidationError,
  HttpStatus,
} from '../../src/utils/response';
import { ErrorCode } from '../../src/utils/errorCodes';
import { getRequestId, setRequestStartTime } from '../../src/utils/requestId';
import { createMockRequest, createMockResponse } from '../helpers/testHelpers';

// Mock requestId utilities
jest.mock('../../src/utils/requestId', () => ({
  generateRequestId: jest.fn(() => 'req_test_123'),
  getRequestId: jest.fn((req: Request) => req.locals?.requestId || 'req_test_123'),
  setRequestStartTime: jest.fn(),
  getProcessingTime: jest.fn(() => 100),
}));

describe('Response Formatter', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = createMockRequest();
    req.locals = {
      requestId: 'req_test_123',
      startTime: Date.now() - 100,
    };
    res = createMockResponse();
  });

  describe('sendSuccess', () => {
    it('should send success response with 200 status', () => {
      const data = { message: 'Success' };
      sendSuccess(req as Request, res as Response, data);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        metadata: {
          requestId: 'req_test_123',
          timestamp: expect.any(String),
          processingTime: 100,
        },
      });
    });
  });

  describe('sendCreated', () => {
    it('should send created response with 201 status', () => {
      const data = { id: '123', name: 'Created' };
      sendCreated(req as Request, res as Response, data);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        metadata: {
          requestId: 'req_test_123',
          timestamp: expect.any(String),
          processingTime: 100,
        },
      });
    });
  });

  describe('sendError', () => {
    it('should send error response with specified status code', () => {
      sendError(
        req as Request,
        res as Response,
        ErrorCode.VALIDATION_ERROR,
        'Test error',
        400
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Test error',
        },
        metadata: {
          requestId: 'req_test_123',
          timestamp: expect.any(String),
          processingTime: 100,
          path: '/',
          method: 'GET',
        },
      });
    });

    it('should include error details when provided', () => {
      const details = { field: 'email', reason: 'Invalid format' };
      sendError(
        req as Request,
        res as Response,
        ErrorCode.VALIDATION_ERROR,
        'Test error',
        400,
        details
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details,
          }),
        })
      );
    });
  });

  describe('sendBadRequest', () => {
    it('should send 400 bad request error', () => {
      sendBadRequest(req as Request, res as Response, 'Bad request');

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Bad request',
          }),
        })
      );
    });
  });

  describe('sendUnauthorized', () => {
    it('should send 401 unauthorized error', () => {
      sendUnauthorized(req as Request, res as Response, 'Unauthorized');

      expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.UNAUTHORIZED,
            message: 'Unauthorized',
          }),
        })
      );
    });
  });

  describe('sendForbidden', () => {
    it('should send 403 forbidden error', () => {
      sendForbidden(req as Request, res as Response, 'Forbidden');

      expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.FORBIDDEN,
            message: 'Forbidden',
          }),
        })
      );
    });
  });

  describe('sendNotFound', () => {
    it('should send 404 not found error', () => {
      sendNotFound(req as Request, res as Response, 'Not found');

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.NOT_FOUND,
            message: 'Not found',
          }),
        })
      );
    });
  });

  describe('sendRateLimitExceeded', () => {
    it('should send 429 rate limit exceeded error', () => {
      sendRateLimitExceeded(req as Request, res as Response, 'Rate limit exceeded');

      expect(res.status).toHaveBeenCalledWith(HttpStatus.RATE_LIMIT_EXCEEDED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.RATE_LIMIT_EXCEEDED,
            message: 'Rate limit exceeded',
          }),
        })
      );
    });
  });

  describe('sendInternalServerError', () => {
    it('should send 500 internal server error', () => {
      sendInternalServerError(req as Request, res as Response, 'Internal error');

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: 'Internal error',
          }),
        })
      );
    });
  });

  describe('sendValidationError', () => {
    it('should send 400 validation error', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      sendValidationError(req as Request, res as Response, 'Validation failed', details);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            details,
          }),
        })
      );
    });
  });
});
