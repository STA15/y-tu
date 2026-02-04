import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authentication';
import { toneAnalysisService } from '../services/toneAnalysis.service';
import { toneAuthService } from '../services/toneAuth.service';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';

class AnalyzeToneController {
  /**
   * Comprehensive AI-powered tone analysis
   */
  async analyze(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, language, context } = req.body;
      const userId = req.user?.id;

      const result = await toneAnalysisService.analyzeTone({
        text,
        language,
        context,
        userId
      });

      // Enhance with additional suggestions
      const enhancedResult = {
        ...result,
        suggestions: toneAnalysisService.generateSuggestions(result)
      };

      sendSuccess(req, res, enhancedResult);
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Tone analysis failed', 500));
    }
  }

  /**
   * Legacy tone authentication (backward compatibility)
   */
  async authenticateTone(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text } = req.body;
      const userId = req.user?.id;

      // Use comprehensive analysis but return in legacy format
      const analysis = await toneAnalysisService.analyzeTone({
        text,
        userId
      });

      const result = {
        isHuman: analysis.toneScore >= 70,
        confidence: analysis.toneScore / 100,
        analysis: {
          naturalness: analysis.detailedAnalysis.naturalness / 100,
          coherence: analysis.detailedAnalysis.contextRelevance / 100,
          emotionalMarkers: analysis.detailedAnalysis.emotionalAppropriateness / 100
        },
        timestamp: analysis.timestamp
      };

      sendSuccess(req, res, result);
    } catch (error) {
      // Fallback to legacy service
      const result = await toneAuthService.authenticateTone({
        text: req.body.text,
        userId: req.user?.id
      });

      sendSuccess(req, res, result);
    }
  }
}

export const analyzeToneController = new AnalyzeToneController();
