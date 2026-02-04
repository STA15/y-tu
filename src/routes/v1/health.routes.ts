import { Router, Request, Response, IRouter } from 'express';;
import { config } from '../../config/config';
import { sendSuccess } from '../../utils/response';

const router: IRouter = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API, including uptime and environment information
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, data, metadata]
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     environment:
 *                       type: string
 *                       example: production
 *                     apiVersion:
 *                       type: string
 *                       example: v1
 *                     uptime:
 *                       type: number
 *                       example: 3600.5
 *                     service:
 *                       type: string
 *                       example: ytu-api
 *                 metadata:
 *                   $ref: '#/components/schemas/ResponseMetadata'
 */
router.get('/', (req: Request, res: Response) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    apiVersion: config.server.apiVersion,
    uptime: process.uptime(),
    service: 'ytu-api'
  };

  sendSuccess(req, res, healthData);
});

export default router;
