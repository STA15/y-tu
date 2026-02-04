import { Router, Request, Response, IRouter, NextFunction } from 'express';
import { authenticate } from '../../middleware/authentication';
import { performanceMonitor } from '../../services/performanceMonitor.service';
import { alertService } from '../../services/alert.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';

const router: IRouter = Router();

/**
 * @swagger
 * /monitoring/performance:
 *   get:
 *     summary: Get performance statistics
 *     description: Get performance statistics for all endpoints or a specific endpoint
 *     tags: [Metrics]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *         description: Specific endpoint to get stats for (optional)
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: integer
 *           default: 3600000
 *         description: Time window in milliseconds (default: 1 hour)
 *     responses:
 *       200:
 *         description: Performance statistics
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
 *                         endpoint:
 *                           type: string
 *                         totalRequests:
 *                           type: number
 *                         successCount:
 *                           type: number
 *                         errorCount:
 *                           type: number
 *                         avgResponseTime:
 *                           type: number
 *                         p95:
 *                           type: number
 *                         p99:
 *                           type: number
 *                         errorRate:
 *                           type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/performance',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const endpoint = req.query.endpoint as string | undefined;
      const timeWindow = req.query.timeWindow 
        ? parseInt(req.query.timeWindow as string, 10)
        : 60 * 60 * 1000; // Default: 1 hour

      let stats;
      if (endpoint) {
        const endpointStats = performanceMonitor.getStats(endpoint, timeWindow);
        stats = { [endpoint]: endpointStats };
      } else {
        const allStats = performanceMonitor.getAllStats(timeWindow);
        stats = Object.fromEntries(allStats);
      }

      sendSuccess(req, res, {
        timeWindow,
        timestamp: new Date().toISOString(),
        stats,
      });
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to get performance stats', 500));
    }
  }
);

/**
 * @swagger
 * /monitoring/alerts:
 *   get:
 *     summary: Get recent alerts
 *     description: Get recent monitoring alerts
 *     tags: [Metrics]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of alerts to return
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by severity
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [HIGH_ERROR_RATE, SLOW_RESPONSE_TIME, RATE_LIMIT_ABUSE, HIGH_ERROR_COUNT]
 *         description: Filter by alert type
 *     responses:
 *       200:
 *         description: Recent alerts
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
 *                         alerts:
 *                           type: array
 *                           items:
 *                             type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/alerts',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit 
        ? parseInt(req.query.limit as string, 10)
        : 100;
      const severity = req.query.severity as string | undefined;
      const type = req.query.type as string | undefined;

      let alerts;
      if (type) {
        alerts = alertService.getAlertsByType(type as any, limit);
      } else if (severity) {
        alerts = alertService.getAlertsBySeverity(severity, limit);
      } else {
        alerts = alertService.getRecentAlerts(limit);
      }

      sendSuccess(req, res, {
        count: alerts.length,
        alerts,
      });
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to get alerts', 500));
    }
  }
);

export default router;
