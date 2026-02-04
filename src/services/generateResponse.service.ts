import { AppError } from '../middleware/errorHandler';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry.util';
import { 
  GenerateResponseRequest, 
  GenerateResponseResponse,
  ResponseCandidate,
  ResponseStyle
} from '../models/responseGeneration.model';
import { createAIResponseGenerationClient } from './aiResponseGeneration.client';
import { responseScoringService } from './responseScoring.service';
import { translationService } from './translation.service';
import NodeCache from 'node-cache';

/**
 * Enhanced AI Response Generation Service
 */
class GenerateResponseService {
  private aiClient: ReturnType<typeof createAIResponseGenerationClient>;
  private cache: NodeCache;
  private readonly MAX_TEXT_LENGTH = 5000;
  private readonly CACHE_TTL = 6 * 60 * 60; // 6 hours
  private readonly DEFAULT_NUM_CANDIDATES = 5;

  constructor() {
    this.aiClient = createAIResponseGenerationClient();
    this.cache = new NodeCache({
      stdTTL: this.CACHE_TTL,
      checkperiod: 60 * 60,
      useClones: false
    });

    logger.info('Response generation service initialized with AI and caching');
  }

  /**
   * Generate cache key
   */
  private getCacheKey(request: GenerateResponseRequest): string {
    const key = JSON.stringify({
      message: request.originalMessage.toLowerCase().trim(),
      language: request.targetLanguage || 'auto',
      style: request.responseStyle || 'professional',
      context: request.businessContext ? Buffer.from(request.businessContext.toLowerCase().trim()).toString('base64').substring(0, 20) : 'noctx'
    });
    return `response:${Buffer.from(key).toString('base64')}`;
  }

  /**
   * Validate input
   */
  private validateInput(request: GenerateResponseRequest): void {
    if (!request.originalMessage || request.originalMessage.trim().length === 0) {
      throw new AppError('Original message is required', 400);
    }

    if (request.originalMessage.length > this.MAX_TEXT_LENGTH) {
      throw new AppError(
        `Original message exceeds maximum length of ${this.MAX_TEXT_LENGTH} characters`,
        400
      );
    }
  }

  /**
   * Generate response with multiple candidates and scoring
   */
  async generate(request: GenerateResponseRequest): Promise<GenerateResponseResponse> {
    const startTime = Date.now();

    try {
      this.validateInput(request);

      // Check cache
      const cacheKey = this.getCacheKey(request);
      const cached = this.cache.get<GenerateResponseResponse>(cacheKey);
      
      if (cached) {
        logger.debug('Response generation cache hit', { cacheKey });
        return cached;
      }

      // Translate original message if target language is different
      let messageToUse = request.originalMessage;
      let detectedLanguage = 'en';

      if (request.targetLanguage) {
        try {
          const detection = await translationService.detectLanguage(request.originalMessage);
          detectedLanguage = detection.language;

          if (detection.language !== request.targetLanguage) {
            const translation = await translationService.translate({
              text: request.originalMessage,
              targetLanguage: request.targetLanguage,
              sourceLanguage: detection.language
            });
            messageToUse = translation.translatedText;
          }
        } catch (error) {
          logger.warn('Translation failed, using original message', { error });
        }
      }

      // Generate multiple candidates with retry logic
      const candidates = await retryWithBackoff(
        () => this.aiClient.generateCandidates({
          originalMessage: messageToUse,
          toneAnalysis: request.toneAnalysis,
          businessContext: request.businessContext,
          targetLanguage: request.targetLanguage || detectedLanguage,
          responseStyle: request.responseStyle || 'professional',
          numCandidates: this.DEFAULT_NUM_CANDIDATES
        }),
        {
          maxRetries: 2,
          initialDelay: 1000,
          maxDelay: 5000
        }
      );

      if (candidates.length === 0) {
        throw new AppError('No valid response candidates generated', 500);
      }

      // Score each candidate
      const scoredCandidates = await this.scoreCandidates(
        candidates,
        messageToUse,
        request.targetLanguage || detectedLanguage,
        request.businessContext
      );

      // Sort by score (highest first)
      scoredCandidates.sort((a, b) => b.score - a.score);

      // Select best response
      const bestCandidate = scoredCandidates[0];
      const alternatives = scoredCandidates.slice(1, 4).map(c => ({
        text: c.text,
        score: c.score
      }));

      const response: GenerateResponseResponse = {
        response: bestCandidate.text,
        score: bestCandidate.score,
        alternatives,
        language: request.targetLanguage || detectedLanguage,
        metadata: {
          totalCandidates: scoredCandidates.length,
          generationTime: Date.now() - startTime,
          model: config.aiServices.openaiModel
        },
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, response);
      logger.debug('Response generated and cached', { 
        cacheKey, 
        score: response.score,
        candidates: scoredCandidates.length 
      });

      return response;
    } catch (error) {
      // Fallback mechanism
      if (error instanceof AppError && error.statusCode !== 500) {
        throw error;
      }

      logger.error('Response generation error, using fallback', { error });
      return this.generateFallbackResponse(request);
    }
  }

  /**
   * Score all candidates
   */
  private async scoreCandidates(
    candidates: Array<{ text: string }>,
    originalMessage: string,
    targetLanguage: string,
    context?: string
  ): Promise<ResponseCandidate[]> {
    const scoringPromises = candidates.map(candidate =>
      this.scoreSingleCandidate(candidate.text, originalMessage, targetLanguage, context)
    );

    const scores = await Promise.all(scoringPromises);

    return candidates.map((candidate, index) => ({
      text: candidate.text,
      score: scores[index].overall,
      scores: scores[index].scores
    }));
  }

  /**
   * Score a single candidate response
   */
  private async scoreSingleCandidate(
    responseText: string,
    originalMessage: string,
    targetLanguage: string,
    context?: string
  ): Promise<{ scores: ResponseCandidate['scores']; overall: number }> {
    try {
      return await responseScoringService.scoreCandidate(
        responseText,
        originalMessage,
        targetLanguage,
        context
      );
    } catch (error) {
      logger.warn('Scoring failed for candidate', { error });
      // Return default scores
      const defaultScores = {
        humanLikeness: 70,
        appropriateness: 70,
        clarity: 70,
        culturalSensitivity: 70
      };
      return {
        scores: defaultScores,
        overall: responseScoringService.calculateOverallScore(defaultScores)
      };
    }
  }

  /**
   * Generate fallback response when AI service fails
   */
  private generateFallbackResponse(request: GenerateResponseRequest): GenerateResponseResponse {
    logger.warn('Using fallback response generation');

    const { originalMessage, targetLanguage, toneAnalysis, responseStyle } = request;

    // Simple template-based fallback
    let response = 'Thank you for your message. ';

    if (toneAnalysis) {
      switch (toneAnalysis.intent) {
        case 'question':
          response += 'I will look into this and get back to you shortly.';
          break;
        case 'complaint':
          response += 'I apologize for any inconvenience. We will address this matter promptly.';
          break;
        case 'request':
          response += 'I will do my best to help you with this.';
          break;
        case 'feedback':
          response += 'Thank you for your feedback. We appreciate your input.';
          break;
        default:
          response += 'I have received your message and will respond accordingly.';
      }
    } else {
      response += 'I have received your message and will respond accordingly.';
    }

    // Adjust formality
    if (toneAnalysis && toneAnalysis.formality > 7) {
      response = response.replace(/I /g, 'We ').replace(/I have/g, 'We have');
    }

    return {
      response,
      score: 60, // Lower score for fallback
      alternatives: [],
      language: targetLanguage || 'en',
      metadata: {
        totalCandidates: 1,
        generationTime: 0,
        model: 'fallback'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.flushAll();
    logger.info('Response generation cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses
    };
  }
}

export const generateResponseService = new GenerateResponseService();