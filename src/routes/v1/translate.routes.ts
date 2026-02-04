import { Router, IRouter } from 'express';
import { translationController } from '../../controllers/translation.controller';
import { authenticate } from '../../middleware/authentication';
import { tieredRateLimiter } from '../../middleware/tieredRateLimiter';
import { validate } from '../../middleware/validation';
import { translateValidationSchema } from '../../middleware/validation.schemas';

const router: IRouter = Router();

/**
 * @swagger
 * /translate:
 *   post:
 *     summary: Translate text
 *     description: |
 *       Translate text from one language to another with high accuracy.
 *       
 *       **Rate Limits by Tier:**
 *       - FREE: 100 requests/day
 *       - STARTER: 1,000 requests/day
 *       - PRO: 10,000 requests/day
 *       - ENTERPRISE: Unlimited
 *       
 *       **Use Cases:**
 *       - Customer service: Translate customer inquiries
 *       - E-commerce: Translate product descriptions
 *       - Content localization: Translate website content
 *     tags: [Translation]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TranslationRequest'
 *           examples:
 *             customerService:
 *               summary: Customer Service Example
 *               value:
 *                 text: "Hello, I need help with my order"
 *                 targetLanguage: "es"
 *                 sourceLanguage: "en"
 *             ecommerce:
 *               summary: E-commerce Example
 *               value:
 *                 text: "This product is out of stock"
 *                 targetLanguage: "fr"
 *                 sourceLanguage: "en"
 *             multilingual:
 *               summary: Multilingual Support
 *               value:
 *                 text: "Thank you for your purchase"
 *                 targetLanguage: "de"
 *                 sourceLanguage: "en"
 *     responses:
 *       200:
 *         description: Translation successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TranslationResponse'
 *             examples:
 *               spanish:
 *                 summary: Spanish Translation
 *                 value:
 *                   success: true
 *                   data:
 *                     originalText: "Hello, how can I help you today?"
 *                     translatedText: "Hola, ¿cómo puedo ayudarte hoy?"
 *                     sourceLanguage: "en"
 *                     targetLanguage: "es"
 *                     confidence: 0.95
 *                   metadata:
 *                     requestId: "req_123"
 *                     timestamp: "2023-12-21T10:30:45.123Z"
 *                     processingTime: 234
 *               french:
 *                 summary: French Translation
 *                 value:
 *                   success: true
 *                   data:
 *                     originalText: "I would like to return this item"
 *                     translatedText: "Je voudrais retourner cet article"
 *                     sourceLanguage: "en"
 *                     targetLanguage: "fr"
 *                     confidence: 0.92
 *                   metadata:
 *                     requestId: "req_124"
 *                     timestamp: "2023-12-21T10:30:45.123Z"
 *                     processingTime: 198
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/',
  authenticate,
  tieredRateLimiter,
  validate(translateValidationSchema()),
  translationController.translateText
);

export default router;
