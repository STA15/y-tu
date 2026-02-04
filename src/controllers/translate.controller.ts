import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authentication';
import { translationService } from '../services/translation.service';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';

class TranslateController {
  async translate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;
      const userId = req.user?.id;

      const result = await translationService.translate({
        text,
        targetLanguage,
        sourceLanguage,
        userId
      });

      sendSuccess(req, res, result);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Translation failed', 500));
    }
  }
}

export const translateController = new TranslateController();
