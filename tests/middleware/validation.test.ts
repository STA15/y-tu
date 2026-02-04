import { Request, Response, NextFunction } from 'express';
import { body, ValidationChain } from 'express-validator';
import { validate, handleValidationErrors } from '../../src/middleware/validation';
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/testHelpers';

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  describe('validate', () => {
    it('should call next() when validation passes', async () => {
      const validations: ValidationChain[] = [
        body('email').isEmail().withMessage('Invalid email'),
        body('name').notEmpty().withMessage('Name is required'),
      ];

      req.body = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const middleware = validate(validations);
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 error when validation fails', async () => {
      const validations: ValidationChain[] = [
        body('email').isEmail().withMessage('Invalid email'),
        body('name').notEmpty().withMessage('Name is required'),
      ];

      req.body = {
        email: 'invalid-email',
        name: '',
      };

      const middleware = validate(validations);
      await middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Validation failed',
            details: expect.any(Array),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle multiple validation errors', async () => {
      const validations: ValidationChain[] = [
        body('email').isEmail().withMessage('Invalid email'),
        body('age').isInt({ min: 0 }).withMessage('Age must be a positive integer'),
      ];

      req.body = {
        email: 'not-an-email',
        age: -5,
      };

      const middleware = validate(validations);
      await middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.error.details.length).toBeGreaterThan(1);
    });

    it('should handle validation errors gracefully', async () => {
      const validations: ValidationChain[] = [
        body('email').isEmail().withMessage('Invalid email'),
      ];

      // Mock validation to throw an error
      jest.spyOn(validations[0], 'run').mockRejectedValue(new Error('Validation error'));

      const middleware = validate(validations);
      await middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Internal validation error',
          }),
        })
      );
    });
  });

  describe('handleValidationErrors', () => {
    it('should call next() when no validation errors', () => {
      req.body = { email: 'test@example.com' };
      
      // Mock validation result to be empty
      const validationResult = require('express-validator').validationResult;
      jest.spyOn(validationResult, 'default').mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      });

      handleValidationErrors(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 error when validation errors exist', () => {
      req.body = { email: 'invalid-email' };
      
      // Mock validation result with errors
      const validationResult = require('express-validator').validationResult;
      jest.spyOn(validationResult, 'default').mockReturnValue({
        isEmpty: () => false,
        array: () => [
          {
            type: 'field',
            path: 'email',
            msg: 'Invalid email',
            value: 'invalid-email',
          },
        ],
      });

      handleValidationErrors(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Validation failed',
            details: expect.any(Array),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
