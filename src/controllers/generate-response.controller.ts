import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authentication';
import { generateResponseService } from '../services/generateResponse.service';
import { toneAnalysisService } from '../services/toneAnalysis.service';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { sendSuccess } from '../utils/response';

class GenerateResponseController {
  async generate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { originalText, context, tone, language, toneAnalysis } = req.body;
      const userId = req.user?.id;

      // Perform tone analysis if not provided
      let analysis = toneAnalysis;
      if (!analysis && originalText) {
        try {
          analysis = await toneAnalysisService.analyzeTone({
            text: originalText,
            language,
            context
          });
        } catch (error) {
          logger.warn('Tone analysis failed, proceeding without it', { error });
        }
      }

      const result = await generateResponseService.generate({
        originalMessage: originalText,
        toneAnalysis: analysis,
        businessContext: context,
        targetLanguage: language,
        responseStyle: tone,
        userId
      });

      sendSuccess(req, res, result);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Response generation failed', 500));
    }
  }
}

export const generateResponseController = new GenerateResponseController();
