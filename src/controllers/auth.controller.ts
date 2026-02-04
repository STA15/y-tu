import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess, sendCreated } from '../utils/response';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.register({
        email,
        password
      });

      sendCreated(req, res, result);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Registration failed', 500));
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login({
        email,
        password
      });

      sendSuccess(req, res, result);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 401) {
        next(error);
      } else {
        next(new AppError('Login failed', 500));
      }
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const result = await authService.refreshToken(refreshToken);

      sendSuccess(req, res, result);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Token refresh failed', 500));
    }
  }
}

export const authController = new AuthController();
