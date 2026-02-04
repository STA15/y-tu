import { Response, NextFunction } from 'express';
import { ApiKeyRequest } from '../middleware/apiKeyAuth';
import { generateResponseService } from '../services/generateResponse.service';
import { toneAnalysisService } from '../services/toneAnalysis.service';
import { AppError } from '../middleware/errorHandler';
import { BaseController } from './base.controller';
import { logger } from '../utils/logger';

/**
 * Response Generation Controller
 * Handles AI response generation with quality checks and comprehensive logging
 */
class ResponseController extends BaseController {
  /**
   * Generate AI-powered response
   */
  async generateResponse(req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      req,
      res,
      next,
      '/api/v1/generate-response',
      async () => {
        const { originalText, context, tone, language, toneAnalysis } = req.body;
        const userId = req.user?.id;
        const apiKeyId = req.apiKey?.id || req.user?.apiKeyId;

        // Validate input
        if (!originalText || typeof originalText !== 'string') {
          throw new AppError('Original text is required and must be a string', 400);
        }

        if (originalText.trim().length === 0) {
          throw new AppError('Original text cannot be empty', 400);
        }

        // Log generation request
        logger.info('Response generation request', {
          apiKeyId,
          userId,
          textLength: originalText.length,
          language: language || 'auto',
          tone: tone || 'professional',
          hasContext: !!context,
          hasToneAnalysis: !!toneAnalysis
        });

        // Perform tone analysis if not provided
        let analysis = toneAnalysis;
        if (!analysis && originalText) {
          try {
            logger.debug('Performing automatic tone analysis', { apiKeyId });
            analysis = await toneAnalysisService.analyzeTone({
              text: originalText,
              language,
              context
            });
          } catch (error) {
            logger.warn('Tone analysis failed, proceeding without it', {
              apiKeyId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Generate response
        const result = await generateResponseService.generate({
          originalMessage: originalText,
          toneAnalysis: analysis,
          businessContext: context,
          targetLanguage: language,
          responseStyle: tone,
          userId
        });

        // Quality checks
        this.performQualityChecks(result, apiKeyId);

        // Log successful generation
        logger.info('Response generation completed', {
          apiKeyId,
          userId,
          score: result.score,
          language: result.language,
          alternativesCount: result.alternatives.length,
          generationTime: result.metadata.generationTime
        });

        return result;
      }
    );
  }

  /**
   * Perform quality checks on generated response
   */
  private performQualityChecks(result: any, apiKeyId: string): void {
    const warnings: string[] = [];

    // Check response score
    if (result.score < 70) {
      warnings.push(`Low response score: ${result.score}`);
      logger.warn('Low quality response generated', {
        apiKeyId,
        score: result.score,
        response: result.response.substring(0, 100)
      });
    }

    // Check response length
    if (result.response.length < 10) {
      warnings.push('Response is too short');
    }

    if (result.response.length > 1000) {
      warnings.push('Response is very long');
    }

    // Check if alternatives are available
    if (result.alternatives.length === 0) {
      warnings.push('No alternative responses available');
    }

    // Check generation time
    if (result.metadata.generationTime > 10000) {
      warnings.push(`Slow generation time: ${result.metadata.generationTime}ms`);
    }

    if (warnings.length > 0) {
      logger.warn('Response quality warnings', {
        apiKeyId,
        warnings,
        score: result.score
      });
    }
  }
}

export const responseController = new ResponseController();
