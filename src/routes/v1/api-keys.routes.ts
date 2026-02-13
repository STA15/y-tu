import { Router, Request, Response, IRouter, NextFunction } from 'express';;
import { body } from 'express-validator';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/authentication';
import { ApiKeyTier } from '../../models/apiKey.model';
import {
  createApiKey,
  getUserApiKeys,
  deactivateApiKey,
  reactivateApiKey,
  deleteApiKey,
  getApiKeyUsage,
  getTierInfo,
  getAllTiers,
  getApiKeyInfo
} from '../../utils/apiKey.utils';
import { AppError } from '../../middleware/errorHandler';
import { apiKeyStore } from '../../services/apiKeyStore.service';
import { sendSuccess, sendCreated } from '../../utils/response';

const router: IRouter = Router();

/**
 * @swagger
 * /api-keys:
 *   get:
 *     summary: List API keys
 *     description: Get all API keys for the authenticated user
 *     tags: [API Keys]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ApiKeyInfo'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('User ID not found', 401);
      }

      const apiKeys = await getUserApiKeys(userId);
      const apiKeysInfo = apiKeys.map(getApiKeyInfo);

      sendSuccess(req, res, apiKeysInfo);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to list API keys', 500));
    }
  }
);

/**
 * @swagger
 * /api-keys:
 *   post:
 *     summary: Create new API key
 *     description: Create a new API key with specified tier. The full key is only returned once on creation.
 *     tags: [API Keys]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, tier]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "My Production Key"
 *               tier:
 *                 $ref: '#/components/schemas/ApiKeyTier'
 *           examples:
 *             free:
 *               summary: Free Tier
 *               value:
 *                 name: "Free Tier Key"
 *                 tier: "FREE"
 *             pro:
 *               summary: Pro Tier
 *               value:
 *                 name: "Production Key"
 *                 tier: "PRO"
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/ApiKeyInfo'
 *                         - type: object
 *                           properties:
 *                             key:
 *                               type: string
 *                               example: "ytu_prod_abc123..."
 *                               description: "Full API key (only shown on creation)"
 *                             message:
 *                               type: string
 *                               example: "Store this API key securely. It will not be shown again."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
const createApiKeyValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('tier')
    .notEmpty()
    .withMessage('Tier is required')
    .isIn(Object.values(ApiKeyTier))
    .withMessage(`Tier must be one of: ${Object.values(ApiKeyTier).join(', ')}`)
];

router.post(
  '/',
  authenticate,
  validate(createApiKeyValidation),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, tier } = req.body;
      const userId = (req as any).user?.id;

      const apiKey = await createApiKey({
        name,
        tier: tier as ApiKeyTier,
        userId
      });

      // Return full key only on creation
      const apiKeyData = {
        ...getApiKeyInfo(apiKey),
        key: apiKey.key, // Only returned on creation
        message: 'Store this API key securely. It will not be shown again.'
      };

      sendCreated(req, res, apiKeyData);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to create API key', 500));
    }
  }
);

router.get(
  '/tiers',
  (req: Request, res: Response) => {
    const tiers = getAllTiers();
    const tierInfo = tiers.map(tier => getTierInfo(tier));

    sendSuccess(req, res, tierInfo);
  }
);

/**
 * @swagger
 * /api-keys/{id}/usage:
 *   get:
 *     summary: Get API key usage statistics
 *     description: Get usage statistics for a specific API key. Optionally filter by date.
 *     tags: [API Keys]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date to get usage for (YYYY-MM-DD). Defaults to today.
 *     responses:
 *       200:
 *         description: Usage statistics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ApiKeyUsage'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Not the owner of this API key
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:id/usage',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const date = req.query.date as string | undefined;
      const userId = (req as any).user?.id;

      const apiKey = await apiKeyStore.findById(id);
      if (!apiKey) {
        throw new AppError('API key not found', 404);
      }

      // Verify ownership
      if (apiKey.userId && apiKey.userId !== userId) {
        throw new AppError('Unauthorized', 403);
      }

      const usage = await getApiKeyUsage(id, date);

      const usageData = usage || {
        apiKeyId: id,
        date: date || new Date().toISOString().split('T')[0],
        requestCount: 0,
        lastRequestAt: null
      };

      sendSuccess(req, res, usageData);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to get usage statistics', 500));
    }
  }
);

/**
 * @swagger
 * /api-keys/{key}:
 *   delete:
 *     summary: Delete API key
 *     description: Permanently delete an API key. This action cannot be undone.
 *     tags: [API Keys]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: API key to delete
 *     responses:
 *       200:
 *         description: API key deleted successfully
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
 *                         message:
 *                           type: string
 *                           example: "API key deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Not the owner of this API key
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  '/:key',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const userId = (req as any).user?.id;

      const apiKey = await apiKeyStore.findByKey(key);
      if (!apiKey) {
        throw new AppError('API key not found', 404);
      }

      // Verify ownership
      if (apiKey.userId && apiKey.userId !== userId) {
        throw new AppError('Unauthorized', 403);
      }

      const deleted = await deleteApiKey(key);

      if (!deleted) {
        throw new AppError('Failed to delete API key', 500);
      }

      sendSuccess(req, res, {
        message: 'API key deleted successfully'
      });
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to delete API key', 500));
    }
  }
);

export default router;