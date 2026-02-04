import { Router, IRouter } from 'express';
import { processController } from '../../controllers/process.controller';
import { authenticate } from '../../middleware/authentication';
import { tieredRateLimiter } from '../../middleware/tieredRateLimiter';
import { validate } from '../../middleware/validation';
import { processValidationSchema } from '../../middleware/validation.schemas';

const router: IRouter = Router();

/**
 * @swagger
 * /process:
 *   post:
 *     summary: All-in-one processing endpoint
 *     description: |
 *       Process text through multiple AI services in a single request:
 *       - Language detection (automatic)
 *       - Translation (if targetLanguage provided)
 *       - Tone analysis (optional)
 *       - Response generation (optional)
 *       
 *       This endpoint is ideal for:
 *       - Customer service automation
 *       - Multi-language support systems
 *       - Content processing pipelines
 *       
 *       **Processing Options:**
 *       - translate: Enable translation (default: true if targetLanguage provided)
 *       - analyzeTone: Enable tone analysis (default: true)
 *       - generateResponse: Enable response generation (default: false)
 *     tags: [Process]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessRequest'
 *           examples:
 *             fullProcessing:
 *               summary: Full Processing (Translate + Analyze + Generate)
 *               value:
 *                 text: "I want to cancel my subscription immediately."
 *                 sourceLanguage: "en"
 *                 targetLanguage: "es"
 *                 context: "SaaS customer service"
 *                 options:
 *                   translate: true
 *                   analyzeTone: true
 *                   generateResponse: true
 *             translationOnly:
 *               summary: Translation Only
 *               value:
 *                 text: "Thank you for your purchase"
 *                 sourceLanguage: "en"
 *                 targetLanguage: "fr"
 *                 options:
 *                   translate: true
 *                   analyzeTone: false
 *                   generateResponse: false
 *             toneAnalysisOnly:
 *               summary: Tone Analysis Only
 *               value:
 *                 text: "This service is terrible, I want a refund!"
 *                 context: "Customer complaint"
 *                 options:
 *                   translate: false
 *                   analyzeTone: true
 *                   generateResponse: false
 *     responses:
 *       200:
 *         description: Processing completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProcessResponse'
 *             examples:
 *               fullProcessing:
 *                 summary: Full Processing Result
 *                 value:
 *                   success: true
 *                   data:
 *                     originalText: "I want to cancel my subscription immediately."
 *                     translation:
 *                       originalText: "I want to cancel my subscription immediately."
 *                       translatedText: "Quiero cancelar mi suscripción de inmediato."
 *                       sourceLanguage: "en"
 *                       targetLanguage: "es"
 *                       confidence: 0.95
 *                     toneAnalysis:
 *                       toneScore: 85
 *                       formality: 6
 *                       emotion: "negative"
 *                       urgency: "high"
 *                       intent: "request"
 *                       detailedAnalysis:
 *                         naturalness: 90
 *                         contextRelevance: 85
 *                         emotionalAppropriateness: 80
 *                         culturalAppropriateness: 85
 *                       timestamp: "2023-12-21T10:30:45.123Z"
 *                     generatedResponse:
 *                       response: "Entendemos su solicitud. Procesaremos la cancelación de su suscripción de inmediato."
 *                       score: 88
 *                       language: "es"
 *                       timestamp: "2023-12-21T10:30:45.123Z"
 *                     timestamp: "2023-12-21T10:30:45.123Z"
 *                   metadata:
 *                     requestId: "req_127"
 *                     timestamp: "2023-12-21T10:30:45.123Z"
 *                     processingTime: 2345
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
  validate(processValidationSchema()),
  processController.processMessage
);

export default router;
