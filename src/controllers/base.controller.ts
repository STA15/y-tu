import { Response, NextFunction, Request } from 'express';
import { ApiKeyRequest } from '../middleware/apiKeyAuth';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess, sendCreated } from '../utils/response';
import { logger } from '../utils/logger';
import { usageMetricsService } from '../utils/usageMetrics';

/**
 * Base controller with common functionality
 */
export abstract class BaseController {
  /**
   * Handle controller method execution with logging and metrics
   */
  protected async execute<T>(
    req: ApiKeyRequest,
    res: Response,
    next: NextFunction,
    endpoint: string,
    handler: () => Promise<T>
  ): Promise<void> {
    const startTime = Date.now();
    let statusCode = 200;
    let success = true;

    try {
      // Log request
      this.logRequest(req, endpoint);

      // Execute handler
      const result = await handler();

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Track usage metrics
      this.trackMetrics(req, endpoint, responseTime, statusCode, success, result);

      // Send success response with appropriate status code
      if (statusCode === 201) {
        sendCreated(req, res, result);
      } else {
        sendSuccess(req, res, result);
      }

      // Log success
      this.logSuccess(req, endpoint, responseTime);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      success = false;

      // Determine status code
      if (error instanceof AppError) {
        statusCode = error.statusCode || 500;
      } else {
        statusCode = 500;
      }

      // Track metrics for error
      this.trackMetrics(req, endpoint, responseTime, statusCode, success, undefined, error);

      // Log error
      this.logError(req, endpoint, error, responseTime);

      // Pass to error handler
      next(error);
    }
  }

  /**
   * Log incoming request
   */
  private logRequest(req: ApiKeyRequest, endpoint: string): void {
    const apiKeyId = req.apiKey?.id || req.user?.apiKeyId || 'unknown';
    const userId = req.user?.id || 'unknown';

    logger.info('Controller request', {
      endpoint,
      method: req.method,
      apiKeyId,
      userId,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  }

  /**
   * Log successful response
   */
  private logSuccess(req: ApiKeyRequest, endpoint: string, responseTime: number): void {
    const apiKeyId = req.apiKey?.id || req.user?.apiKeyId || 'unknown';

    logger.info('Controller success', {
      endpoint,
      apiKeyId,
      responseTime: `${responseTime}ms`
    });
  }

  /**
   * Log error
   */
  private logError(
    req: ApiKeyRequest,
    endpoint: string,
    error: any,
    responseTime: number
  ): void {
    const apiKeyId = req.apiKey?.id || req.user?.apiKeyId || 'unknown';

    logger.error('Controller error', {
      endpoint,
      apiKeyId,
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: error instanceof AppError ? error.statusCode : 500,
      responseTime: `${responseTime}ms`,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }

  /**
   * Track usage metrics
   */
  private trackMetrics(
    req: ApiKeyRequest,
    endpoint: string,
    responseTime: number,
    statusCode: number,
    success: boolean,
    result?: any,
    error?: any
  ): void {
    try {
      const metadata: Record<string, any> = {};

      // Extract metadata from result
      if (result) {
        if (typeof result === 'object') {
          if ('text' in result) metadata.textLength = (result.text as string).length;
          if ('originalText' in result) metadata.textLength = (result.originalText as string).length;
          if ('language' in result) metadata.language = result.language;
          if ('targetLanguage' in result) metadata.language = result.targetLanguage;
          if ('score' in result) metadata.score = result.score;
          if ('toneScore' in result) metadata.score = result.toneScore;
          if ('confidence' in result) metadata.confidence = result.confidence;
        }
      }

      usageMetricsService.trackUsage(
        req,
        endpoint,
        responseTime,
        statusCode,
        success,
        metadata
      );
    } catch (error) {
      // Don't fail request if metrics tracking fails
      logger.warn('Metrics tracking failed', { error });
    }
  }
}
