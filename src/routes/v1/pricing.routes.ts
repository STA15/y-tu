import { Router, Request, Response, IRouter } from 'express';
import { getAllPricingPlans, getPricingPlan, comparePlans } from '../../models/pricing.model';
import { ApiKeyTier } from '../../models/apiKey.model';
import { sendSuccess } from '../../utils/response';

const router: IRouter = Router();

/**
 * @swagger
 * /pricing:
 *   get:
 *     summary: Get pricing plans
 *     description: Get information about all available pricing plans and their features
 *     tags: [API Keys]
 *     security: []
 *     responses:
 *       200:
 *         description: Pricing plans information
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
 *                         plans:
 *                           type: array
 *                           items:
 *                             type: object
 *                         comparison:
 *                           type: array
 *                           items:
 *                             type: object
 */
router.get('/', (req: Request, res: Response) => {
  const plans = getAllPricingPlans();
  const comparison = comparePlans();

  sendSuccess(req, res, {
    plans,
    comparison,
  });
});

/**
 * @swagger
 * /pricing/{tier}:
 *   get:
 *     summary: Get specific pricing plan
 *     description: Get detailed information about a specific pricing plan
 *     tags: [API Keys]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: tier
 *         required: true
 *         schema:
 *           type: string
 *           enum: [FREE, STARTER, PRO, ENTERPRISE]
 *         description: Pricing tier
 *     responses:
 *       200:
 *         description: Pricing plan details
 *       404:
 *         description: Plan not found
 */
router.get('/:tier', (req: Request, res: Response) => {
  const { tier } = req.params;
  
  if (!Object.values(ApiKeyTier).includes(tier as ApiKeyTier)) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Pricing plan '${tier}' not found`,
      },
    });
  }

  const plan = getPricingPlan(tier as ApiKeyTier);
  sendSuccess(req, res, plan);
});

export default router;
