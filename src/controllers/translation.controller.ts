import { Response, NextFunction } from 'express';
import { ApiKeyRequest } from '../middleware/apiKeyAuth';
import { translationService } from '../services/translation.service';
import { AppError } from '../middleware/errorHandler';
import { BaseController } from './base.controller';
import { logger } from '../utils/logger';

/**
 * Translation Controller
 * Handles translation requests with comprehensive error handling and logging
 */
class TranslationController extends BaseController {
  /**
   * Translate text from source language to target language
   */
  async translateText(req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      req,
      res,
      next,
      '/api/v1/translate',
      async () => {
        const { text, targetLanguage, sourceLanguage } = req.body;
        const userId = req.user?.id;
        const apiKeyId = req.apiKey?.id || req.user?.apiKeyId;

        // Validate required fields
        if (!text || typeof text !== 'string') {
          throw new AppError('Text is required and must be a string', 400);
        }

        if (!targetLanguage || typeof targetLanguage !== 'string') {
          throw new AppError('Target language is required', 400);
        }

        // Log translation request
        logger.info('Translation request', {
          apiKeyId,
          userId,
          textLength: text.length,
          sourceLanguage: sourceLanguage || 'auto',
          targetLanguage
        });

        // Validate language support
        try {
          const supportedLanguages = await translationService.getSupportedLanguages();
          const languageCodes = supportedLanguages.map(lang => lang.code);

          if (!languageCodes.includes(targetLanguage)) {
            throw new AppError(
              `Unsupported target language: ${targetLanguage}. Supported languages: ${languageCodes.join(', ')}`,
              400
            );
          }

          if (sourceLanguage && !languageCodes.includes(sourceLanguage)) {
            throw new AppError(
              `Unsupported source language: ${sourceLanguage}. Supported languages: ${languageCodes.join(', ')}`,
              400
            );
          }
        } catch (error) {
          if (error instanceof AppError) {
            throw error;
          }
          logger.warn('Language validation failed, proceeding anyway', { error });
        }

        // Perform translation
        const result = await translationService.translate({
          text,
          targetLanguage,
          sourceLanguage,
          userId
        });

        // Log successful translation
        logger.info('Translation completed', {
          apiKeyId,
          userId,
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage,
          confidence: result.confidence
        });

        return result;
      }
    );
  }

  /**
   * Detect language of text
   */
  async detectLanguage(req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      req,
      res,
      next,
      '/api/v1/languages/detect',
      async () => {
        const { text } = req.body;
        const apiKeyId = req.apiKey?.id || req.user?.apiKeyId;

        if (!text || typeof text !== 'string') {
          throw new AppError('Text is required and must be a string', 400);
        }

        logger.info('Language detection request', {
          apiKeyId,
          textLength: text.length
        });

        const result = await translationService.detectLanguage(text);

        logger.info('Language detection completed', {
          apiKeyId,
          detectedLanguage: result.language,
          confidence: result.confidence
        });

        return result;
      }
    );
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      req,
      res,
      next,
      '/api/v1/languages',
      async () => {
        const apiKeyId = req.apiKey?.id || req.user?.apiKeyId;

        logger.debug('Get supported languages request', { apiKeyId });

        const languages = await translationService.getSupportedLanguages();

        return languages;
      }
    );
  }
}

export const translationController = new TranslationController();
