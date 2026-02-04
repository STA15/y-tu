import { Router, IRouter } from 'express';
import { translationController } from '../controllers/translation.controller';
import { authenticate } from '../middleware/authentication';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';

const router: IRouter = Router();

// Translation validation rules
const translationValidation = [
  body('text')
    .notEmpty()
    .withMessage('Text is required')
    .isString()
    .withMessage('Text must be a string')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Text must be between 1 and 10000 characters'),
  body('targetLanguage')
    .notEmpty()
    .withMessage('Target language is required')
    .isString()
    .withMessage('Target language must be a string')
    .isLength({ min: 2, max: 10 })
    .withMessage('Target language code must be between 2 and 10 characters'),
  body('sourceLanguage')
    .optional()
    .isString()
    .withMessage('Source language must be a string')
    .isLength({ min: 2, max: 10 })
    .withMessage('Source language code must be between 2 and 10 characters')
];

// Routes
router.post(
  '/translate',
  authenticate,
  validate(translationValidation),
  translationController.translateText.bind(translationController)
);

router.post(
  '/detect',
  authenticate,
  translationController.detectLanguage.bind(translationController)
);

router.get(
  '/languages',
  authenticate,
  translationController.getSupportedLanguages.bind(translationController)
);

export default router;