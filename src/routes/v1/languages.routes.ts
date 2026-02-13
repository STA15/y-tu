import { Router, IRouter } from 'express';
import { translationController } from '../../controllers/translation.controller';
import { authenticate } from '../../middleware/authentication';
import { body } from 'express-validator';
import { validate } from '../../middleware/validation';
import { tieredRateLimiter } from '../../middleware/tieredRateLimiter';

const router: IRouter = Router();

/**
 * @swagger
 * /languages/detect:
 *   post:
 *     summary: Detect language of text
 *     description: Automatically detect the language of the provided text using AI
 *     tags: [Languages]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 5000
 *                 example: "Bonjour, comment allez-vous?"
 *           examples:
 *             french:
 *               summary: French Text
 *               value:
 *                 text: "Bonjour, comment allez-vous?"
 *             spanish:
 *               summary: Spanish Text
 *               value:
 *                 text: "Hola, ¿cómo estás?"
 *             english:
 *               summary: English Text
 *               value:
 *                 text: "Hello, how are you?"
 *     responses:
 *       200:
 *         description: Language detected successfully
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
 *                         language:
 *                           type: string
 *                           example: "fr"
 *                         confidence:
 *                           type: number
 *                           minimum: 0
 *                           maximum: 1
 *                           example: 0.95
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
const detectLanguageValidation = [
  body('text')
    .notEmpty()
    .withMessage('Text is required')
    .isString()
    .withMessage('Text must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters')
];

router.post(
  '/detect',
  authenticate,
  tieredRateLimiter,
  validate(detectLanguageValidation),
  translationController.detectLanguage.bind(translationController)
);

/**
 * @swagger
 * /languages:
 *   get:
 *     summary: Get supported languages
 *     description: Returns a list of all supported languages for translation
 *     tags: [Languages]
 *     responses:
 *       200:
 *         description: List of supported languages
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
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                             example: "en"
 *                           name:
 *                             type: string
 *                             example: "English"
 *             example:
 *               success: true
 *               data:
 *                 - code: "en"
 *                   name: "English"
 *                 - code: "es"
 *                   name: "Spanish"
 *                 - code: "fr"
 *                   name: "French"
 *               metadata:
 *                 requestId: "req_128"
 *                 timestamp: "2023-12-21T10:30:45.123Z"
 *                 processingTime: 45
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/',
  translationController.getSupportedLanguages.bind(translationController)
);

export default router;