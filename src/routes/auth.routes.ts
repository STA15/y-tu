import { Router, IRouter } from 'express';
import { authController } from '../controllers/auth.controller';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';

const router: IRouter = Router();

// Registration validation
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes
router.post(
  '/register',
  validate(registerValidation),
  authController.register
);

router.post(
  '/login',
  validate(loginValidation),
  authController.login
);

router.post(
  '/refresh',
  authController.refreshToken
);

export default router;
