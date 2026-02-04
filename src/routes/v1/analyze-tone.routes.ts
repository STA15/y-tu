import { Router, IRouter } from 'express';
import { toneAnalysisController } from '../../controllers/toneAnalysis.controller';
import { authenticate } from '../../middleware/authentication';
import { tieredRateLimiter } from '../../middleware/tieredRateLimiter';
import { validate } from '../../middleware/validation';
import { analyzeToneValidationSchema } from '../../middleware/validation.schemas';

const router: IRouter = Router();

/**
 * @swagger
 * /analyze-tone:
 *   post:
 *     summary: Analyze text tone and authenticity
 *     description: |
 *       Analyze text for human-likeness, formality, emotion, urgency, and intent using AI.
 *       
 *       **Analysis Dimensions:**
 *       - Formality (1-10): How formal is the language?
 *       - Emotion: positive, neutral, negative, or mixed
 *       - Urgency: low, medium, or high
 *       - Intent: question, complaint, request, feedback, or other
 *       - Human-likeness Score (0-100): Overall authenticity score
 *       
 *       **Use Cases:**
 *       - Customer service: Analyze customer sentiment
 *       - Content moderation: Detect inappropriate tone
 *       - Quality assurance: Ensure professional communication
 *     tags: [Tone Analysis]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ToneAnalysisRequest'
 *           examples:
 *             complaint:
 *               summary: Customer Complaint
 *               value:
 *                 text: "I am extremely disappointed with the service quality. This is unacceptable."
 *                 language: "en"
 *                 context: "Customer service"
 *             question:
 *               summary: Customer Question
 *               value:
 *                 text: "Could you please help me understand the return policy?"
 *                 language: "en"
 *                 context: "E-commerce support"
 *             positive:
 *               summary: Positive Feedback
 *               value:
 *                 text: "Thank you so much! The product exceeded my expectations."
 *                 language: "en"
 *                 context: "Product review"
 *     responses:
 *       200:
 *         description: Tone analysis successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ToneAnalysisResponse'
 *             examples:
 *               complaint:
 *                 summary: Complaint Analysis
 *                 value:
 *                   success: true
 *                   data:
 *                     toneScore: 85
 *                     formality: 7
 *                     emotion: "negative"
 *                     urgency: "high"
 *                     intent: "complaint"
 *                     detailedAnalysis:
 *                       naturalness: 90
 *                       contextRelevance: 85
 *                       emotionalAppropriateness: 80
 *                       culturalAppropriateness: 85
 *                     suggestions:
 *                       - "Address the concern directly"
 *                       - "Use empathetic language"
 *                     timestamp: "2023-12-21T10:30:45.123Z"
 *                   metadata:
 *                     requestId: "req_125"
 *                     timestamp: "2023-12-21T10:30:45.123Z"
 *                     processingTime: 456
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
  validate(analyzeToneValidationSchema()),
  toneAnalysisController.analyzeTone
);

export default router;
