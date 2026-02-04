import { Response, NextFunction } from 'express';
import { ApiKeyRequest } from '../middleware/apiKeyAuth';
import { translationService } from '../services/translation.service';
import { toneAnalysisService } from '../services/toneAnalysis.service';
import { generateResponseService } from '../services/generateResponse.service';
import { AppError } from '../middleware/errorHandler';
import { BaseController } from './base.controller';
import { logger } from '../utils/logger';

/**
 * Process Controller (All-in-One)
 * Executes full pipeline: detect/translate language, analyze tone, generate optimal response
 */
class ProcessController extends BaseController {
  /**
   * Process message through full pipeline
   */
  async processMessage(req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      req,
      res,
      next,
      '/api/v1/process',
      async () => {
        const { text, targetLanguage, sourceLanguage, context, options = {} } = req.body;
        const userId = req.user?.id;
        const apiKeyId = req.apiKey?.id || req.user?.apiKeyId;

        // Validate input
        if (!text || typeof text !== 'string') {
          throw new AppError('Text is required and must be a string', 400);
        }

        if (text.trim().length === 0) {
          throw new AppError('Text cannot be empty', 400);
        }

        // Determine which operations to perform
        const shouldTranslate = options.translate !== false && targetLanguage;
        const shouldAnalyzeTone = options.analyzeTone !== false;
        const shouldGenerateResponse = options.generateResponse === true;

        // Log processing request
        logger.info('Processing request', {
          apiKeyId,
          userId,
          textLength: text.length,
          operations: {
            translate: shouldTranslate,
            analyzeTone: shouldAnalyzeTone,
            generateResponse: shouldGenerateResponse
          },
          targetLanguage,
          sourceLanguage
        });

        const pipelineStartTime = Date.now();
        const result: any = {
          originalText: text,
          timestamp: new Date().toISOString()
        };

        // Step 1: Detect/Translate language
        let detectedLanguage = sourceLanguage;
        if (!detectedLanguage) {
          try {
            const detection = await translationService.detectLanguage(text);
            detectedLanguage = detection.language;
            result.detectedLanguage = detection.language;
            result.detectionConfidence = detection.confidence;

            logger.debug('Language detected', {
              apiKeyId,
              detectedLanguage,
              confidence: detection.confidence
            });
          } catch (error) {
            logger.warn('Language detection failed', {
              apiKeyId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            detectedLanguage = 'en'; // Default fallback
          }
        }

        // Step 2: Translate if requested
        if (shouldTranslate && targetLanguage && detectedLanguage !== targetLanguage) {
          try {
            const translation = await translationService.translate({
              text,
              targetLanguage,
              sourceLanguage: detectedLanguage,
              userId
            });

            result.translation = {
              translatedText: translation.translatedText,
              sourceLanguage: translation.sourceLanguage,
              targetLanguage: translation.targetLanguage,
              confidence: translation.confidence
            };

            logger.debug('Translation completed', {
              apiKeyId,
              sourceLanguage: translation.sourceLanguage,
              targetLanguage: translation.targetLanguage,
              confidence: translation.confidence
            });
          } catch (error) {
            logger.error('Translation failed in pipeline', {
              apiKeyId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new AppError('Translation failed', 500);
          }
        }

        // Step 3: Analyze tone if requested
        let toneAnalysisResult: any = undefined;
        if (shouldAnalyzeTone) {
          try {
            const textToAnalyze = result.translation?.translatedText || text;
            toneAnalysisResult = await toneAnalysisService.analyzeTone({
              text: textToAnalyze,
              language: targetLanguage || detectedLanguage,
              context,
              userId
            });

            result.toneAnalysis = {
              toneScore: toneAnalysisResult.toneScore,
              formality: toneAnalysisResult.formality,
              emotion: toneAnalysisResult.emotion,
              urgency: toneAnalysisResult.urgency,
              intent: toneAnalysisResult.intent,
              suggestions: toneAnalysisService.generateSuggestions(toneAnalysisResult),
              culturalContext: toneAnalysisResult.culturalContext,
              detailedAnalysis: toneAnalysisResult.detailedAnalysis
            };

            logger.debug('Tone analysis completed', {
              apiKeyId,
              toneScore: toneAnalysisResult.toneScore,
              emotion: toneAnalysisResult.emotion,
              intent: toneAnalysisResult.intent
            });
          } catch (error) {
            logger.error('Tone analysis failed in pipeline', {
              apiKeyId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            // Don't fail entire pipeline, just log error
            result.toneAnalysisError = error instanceof Error ? error.message : 'Tone analysis failed';
          }
        }

        // Step 4: Generate response if requested
        if (shouldGenerateResponse) {
          try {
            const messageToUse = result.translation?.translatedText || text;
            const response = await generateResponseService.generate({
              originalMessage: messageToUse,
              toneAnalysis: toneAnalysisResult ?? undefined,
              businessContext: context,
              targetLanguage: targetLanguage || detectedLanguage,
              userId
            });

            result.generatedResponse = {
              response: response.response,
              score: response.score,
              alternatives: response.alternatives,
              language: response.language,
              metadata: response.metadata
            };

            logger.debug('Response generation completed', {
              apiKeyId,
              score: response.score,
              language: response.language
            });
          } catch (error) {
            logger.error('Response generation failed in pipeline', {
              apiKeyId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            // Don't fail entire pipeline, just log error
            result.responseGenerationError = error instanceof Error ? error.message : 'Response generation failed';
          }
        }

        // Calculate total pipeline time
        const pipelineTime = Date.now() - pipelineStartTime;
        result.pipelineTime = pipelineTime;

        // Log successful pipeline completion
        logger.info('Processing pipeline completed', {
          apiKeyId,
          userId,
          pipelineTime: `${pipelineTime}ms`,
          operations: {
            translate: !!result.translation,
            analyzeTone: !!result.toneAnalysis,
            generateResponse: !!result.generatedResponse
          }
        });

        return result;
      }
    );
  }
}

export const processController = new ProcessController();