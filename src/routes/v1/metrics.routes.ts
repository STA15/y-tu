import { Router, Request, Response, IRouter, NextFunction } from 'express';
import { authenticate } from '../../middleware/authentication';
import { tieredRateLimiter } from '../../middleware/tieredRateLimiter';
import { usageMetricsService } from '../../utils/usageMetrics';
import { AppError } from '../../middleware/errorHandler';
import { ApiKeyRequest } from '../../middleware/apiKeyAuth';
import { sendSuccess } from '../../utils/response';

const router: IRouter = Router();

/**
 * @swagger
 * /metrics/usage:
 *   get:
 *     summary: Get usage metrics
 *     description: Get usage statistics for the authenticated API key. Optionally filter by date range.
 *     tags: [Metrics]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for metrics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for metrics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Usage metrics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         apiKeyId:
 *                           type: string
 *                         totalRequests:
 *                           type: number
 *                         requestsByEndpoint:
 *                           type: object
 *                         timeRange:
 *                           type: object
 *                           properties:
 *                             start:
 *                               type: string
 *                               format: date-time
 *                             end:
 *                               type: string
 *                               format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/usage',
  authenticate,
  tieredRateLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKeyId = (req as ApiKeyRequest).apiKey?.id || (req as ApiKeyRequest).user?.apiKeyId;

      if (!apiKeyId) {
        throw new AppError('API key not found', 401);
      }

      // Optional time range query parameters
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      let timeRange;
      if (startDate && endDate) {
        timeRange = {
          start: new Date(startDate),
          end: new Date(endDate)
        };
      }

      const stats = usageMetricsService.getUsageStats(apiKeyId, timeRange);

      const metricsData = {
        apiKeyId,
        ...stats,
        timeRange: timeRange ? {
          start: timeRange.start.toISOString(),
          end: timeRange.end.toISOString()
        } : undefined
      };

      sendSuccess(req, res, metricsData);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to get usage metrics', 500));
    }
  }
);

export default router;
