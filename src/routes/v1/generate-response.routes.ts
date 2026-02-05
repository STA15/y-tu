import { Router, IRouter } from 'express';
import { generateResponseController } from '../../controllers/generate-response.controller';
import { authenticate } from '../../middleware/authentication';
import { tieredRateLimiter } from '../../middleware/tieredRateLimiter';
import { validate } from '../../middleware/validation';
import { generateResponseValidationSchema } from '../../middleware/validation.schemas';

const router: IRouter = Router();

/**
 * @swagger
 * /generate-response:
 *   post:
 *     summary: Generate human-like AI responses
 *     description: |
 *       Generate contextually appropriate, human-like responses using AI.
 *       The service generates multiple candidates and selects the best one based on:
 *       - Human-likeness (natural language patterns)
 *       - Appropriateness (context and intent matching)
 *       - Clarity (readability and understanding)
 *       - Cultural sensitivity (cultural appropriateness)
 *       
 *       **Response Styles:**
 *       - professional: Business-appropriate language
 *       - casual: Relaxed, informal tone
 *       - friendly: Warm and approachable
 *       - formal: Very formal and respectful
 *       - creative: Unique and engaging
 *       - empathetic: Understanding and compassionate
 *       - concise: Brief and to the point
 *       
 *       **Use Cases:**
 *       - Customer service: Auto-generate responses to customer inquiries
 *       - Email automation: Generate professional email responses
 *       - Chatbots: Create natural conversation responses
 *     tags: [Response Generation]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateResponseRequest'
 *           examples:
 *             customerService:
 *               summary: Customer Service Response
 *               value:
 *                 originalText: "I need to return this product, it arrived damaged."
 *                 context: "E-commerce customer service"
 *                 tone: "empathetic"
 *                 language: "en"
 *             professional:
 *               summary: Professional Email
 *               value:
 *                 originalText: "When will my order be shipped?"
 *                 context: "E-commerce order inquiry"
 *                 tone: "professional"
 *                 language: "en"
 *             multilingual:
 *               summary: Multilingual Response
 *               value:
 *                 originalText: "¿Cuál es su política de devolución?"
 *                 context: "Customer service"
 *                 tone: "friendly"
 *                 language: "es"
 *     responses:
 *       200:
 *         description: Response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GenerateResponseResponse'
 *             examples:
 *               empathetic:
 *                 summary: Empathetic Response
 *                 value:
 *                   success: true
 *                   data:
 *                     response: "I sincerely apologize for the inconvenience. We will process your return immediately and send a replacement right away."
 *                     score: 88
 *                     alternatives:
 *                       - text: "We apologize for the damaged product. Your return is being processed."
 *                         score: 85
 *                     language: "en"
 *                     metadata:
 *                       totalCandidates: 5
 *                       generationTime: 1234
 *                       model: "gpt-4"
 *                     timestamp: "2023-12-21T10:30:45.123Z"
 *                   metadata:
 *                     requestId: "req_126"
 *                     timestamp: "2023-12-21T10:30:45.123Z"
 *                     processingTime: 1456
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
  validate(generateResponseValidationSchema()),
  generateResponseController.generate.bind(generateResponseController)
);

export default router;