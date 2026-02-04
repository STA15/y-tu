import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, ValidationError, FieldValidationError } from 'express-validator';
import { sendValidationError, sendInternalServerError } from '../utils/response';

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

/**
 * Type guard to check if error is a FieldValidationError
 */
const isFieldValidationError = (err: ValidationError): err is FieldValidationError => {
  return err.type === 'field';
};

/**
 * Standardized validation error response format
 */
const formatValidationErrors = (errors: ValidationError[]): ValidationErrorDetail[] => {
  return errors.map(err => {
    const detail: ValidationErrorDetail = {
      field: isFieldValidationError(err) ? err.path : 'unknown',
      message: err.msg
    };

    // Only add value if it's a field validation error
    if (isFieldValidationError(err) && err.value !== undefined) {
      detail.value = err.value;
    }

    return detail;
  });
};

/**
 * Validation middleware that returns standardized error responses
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Run all validations
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      
      if (errors.isEmpty()) {
        return next();
      }

      // Format errors in standardized format
      const errorDetails = formatValidationErrors(errors.array());

      // Return standardized 400 error response
      sendValidationError(req, res, 'Validation failed', errorDetails);
    } catch (error) {
      // Handle unexpected errors during validation
      sendInternalServerError(req, res, 'Internal validation error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

/**
 * Legacy validation error handler (for backward compatibility)
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = formatValidationErrors(errors.array());
    sendValidationError(req, res, 'Validation failed', errorDetails);
    return;
  }
  
  next();
};