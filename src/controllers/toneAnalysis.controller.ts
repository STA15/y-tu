import { Response, NextFunction } from 'express';
import { ApiKeyRequest } from '../middleware/apiKeyAuth';
import { toneAnalysisService } from '../services/toneAnalysis.service';
import { translationService } from '../services/translation.service';
import { AppError } from '../middleware/errorHandler';
import { BaseController } from './base.controller';
import { logger } from '../utils/logger';

/**
 * Tone Analysis Controller
 * Handles tone analysis requests with language validation and comprehensive logging
 */
class ToneAnalysisController extends BaseController {
  /**
   * Analyze tone of text
   */
  async analyzeTone(req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      req,
      res,
      next,
      '/api/v1/analyze-tone',
      async () => {
        const { text, language, context } = req.body;
        const userId = req.user?.id;
        const apiKeyId = req.apiKey?.id || req.user?.apiKeyId;

        // Validate input
        if (!text || typeof text !== 'string') {
          throw new AppError('Text is required and must be a string', 400);
        }

        if (text.trim().length === 0) {
          throw new AppError('Text cannot be empty', 400);
        }

        // Validate language support if provided
        if (language) {
          try {
            const supportedLanguages = await translationService.getSupportedLanguages();
            const languageCodes = supportedLanguages.map(lang => lang.code);

            if (!languageCodes.includes(language)) {
              logger.warn('Unsupported language provided, will auto-detect', {
                apiKeyId,
                providedLanguage: language
              });
              // Don't throw error, just log warning - service will auto-detect
            }
          } catch (error) {
            logger.warn('Language validation failed, proceeding with auto-detection', { error });
          }
        }

        // Log analysis request
        logger.info('Tone analysis request', {
          apiKeyId,
          userId,
          textLength: text.length,
          language: language || 'auto',
          hasContext: !!context
        });

        // Perform tone analysis
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

        // Log successful analysis
        logger.info('Tone analysis completed', {
          apiKeyId,
          userId,
          toneScore: result.toneScore,
          emotion: result.emotion,
          intent: result.intent,
          urgency: result.urgency
        });

        return enhancedResult;
      }
    );
  }
}

export const toneAnalysisController = new ToneAnalysisController();
