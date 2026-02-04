import { AppError } from '../middleware/errorHandler';
import { ToneAnalysisRequest, ToneAnalysisResponse } from '../models/toneAnalysis.model';
import { createAIToneAnalysisClient } from './aiToneAnalysis.client';
import { retryWithBackoff } from '../utils/retry.util';
import { logger } from '../utils/logger';
import NodeCache from 'node-cache';
import { translationService } from './translation.service';

/**
 * Comprehensive Tone Analysis Service with AI integration
 */
class ToneAnalysisService {
  private aiClient: ReturnType<typeof createAIToneAnalysisClient>;
  private cache: NodeCache;
  private readonly MAX_TEXT_LENGTH = 5000;
  private readonly CACHE_TTL = 12 * 60 * 60; // 12 hours

  constructor() {
    this.aiClient = createAIToneAnalysisClient();
    this.cache = new NodeCache({
      stdTTL: this.CACHE_TTL,
      checkperiod: 60 * 60, // Check for expired keys every hour
      useClones: false
    });

    logger.info('Tone analysis service initialized with AI and caching');
  }

  /**
   * Generate cache key for tone analysis
   */
  private getCacheKey(text: string, language?: string, context?: string): string {
    const normalizedText = text.toLowerCase().trim();
    const lang = language || 'auto';
    const ctx = context ? Buffer.from(context.toLowerCase().trim()).toString('base64').substring(0, 20) : 'noctx';
    return `tone:${lang}:${ctx}:${Buffer.from(normalizedText).toString('base64')}`;
  }

  /**
   * Validate text length
   */
  private validateTextLength(text: string): void {
    if (text.length > this.MAX_TEXT_LENGTH) {
      throw new AppError(
        `Text exceeds maximum length of ${this.MAX_TEXT_LENGTH} characters`,
        400
      );
    }

    if (text.trim().length === 0) {
      throw new AppError('Text cannot be empty', 400);
    }
  }

  /**
   * Detect language if not provided
   */
  private async detectLanguageIfNeeded(text: string, providedLanguage?: string): Promise<string> {
    if (providedLanguage) {
      return providedLanguage;
    }

    try {
      const detection = await translationService.detectLanguage(text);
      return detection.language;
    } catch (error) {
      logger.warn('Language detection failed, using default', { error });
      return 'en'; // Default to English
    }
  }

  /**
   * Analyze tone with comprehensive AI-powered analysis
   */
  async analyzeTone(request: ToneAnalysisRequest): Promise<ToneAnalysisResponse> {
    try {
      const { text, language, context } = request;

      // Validate input
      this.validateTextLength(text);

      // Detect language if not provided
      const detectedLanguage = await this.detectLanguageIfNeeded(text, language);

      // Check cache
      const cacheKey = this.getCacheKey(text, detectedLanguage, context);
      const cached = this.cache.get<ToneAnalysisResponse>(cacheKey);
      
      if (cached) {
        logger.debug('Tone analysis cache hit', { cacheKey });
        return cached;
      }

      // Analyze with AI (with retry logic)
      const aiResponse = await retryWithBackoff(
        () => this.aiClient.analyzeTone(text, detectedLanguage, context),
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2
        }
      );

      // Build comprehensive response
      const response: ToneAnalysisResponse = {
        toneScore: aiResponse.toneScore,
        formality: aiResponse.formality,
        emotion: aiResponse.emotion,
        urgency: aiResponse.urgency,
        intent: aiResponse.intent,
        suggestions: aiResponse.suggestions || [],
        culturalContext: aiResponse.culturalContext,
        detailedAnalysis: aiResponse.detailedAnalysis,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, response);
      logger.debug('Tone analysis cached', { cacheKey, toneScore: response.toneScore });

      return response;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Tone analysis service error', { error });
      throw new AppError(
        `Tone analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Calculate human-likeness score from detailed analysis
   */
  calculateHumanLikenessScore(detailedAnalysis: ToneAnalysisResponse['detailedAnalysis']): number {
    // Weighted average of all factors
    const weights = {
      naturalness: 0.35,
      emotionalAppropriateness: 0.25,
      contextRelevance: 0.25,
      culturalAppropriateness: 0.15
    };

    const score = 
      detailedAnalysis.naturalness * weights.naturalness +
      detailedAnalysis.emotionalAppropriateness * weights.emotionalAppropriateness +
      detailedAnalysis.contextRelevance * weights.contextRelevance +
      detailedAnalysis.culturalAppropriateness * weights.culturalAppropriateness;

    return Math.round(score);
  }

  /**
   * Get improvement suggestions based on analysis
   */
  generateSuggestions(analysis: ToneAnalysisResponse): string[] {
    const suggestions: string[] = [];

    // Add AI-generated suggestions
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      suggestions.push(...analysis.suggestions);
    }

    // Add additional suggestions based on scores
    if (analysis.toneScore < 70) {
      if (analysis.detailedAnalysis.naturalness < 60) {
        suggestions.push('Consider using more natural language patterns and varied sentence structures.');
      }
      if (analysis.detailedAnalysis.emotionalAppropriateness < 60) {
        suggestions.push('Adjust emotional tone to better match the context and intent.');
      }
      if (analysis.detailedAnalysis.contextRelevance < 60) {
        suggestions.push('Ensure the message is relevant to the context and situation.');
      }
      if (analysis.detailedAnalysis.culturalAppropriateness < 60) {
        suggestions.push('Consider cultural context and appropriateness for your audience.');
      }
    }

    // Formality suggestions
    if (analysis.formality < 3 && analysis.intent === 'request') {
      suggestions.push('Consider using a more formal tone for requests.');
    }
    if (analysis.formality > 8 && analysis.intent === 'feedback') {
      suggestions.push('A slightly less formal tone might be more appropriate for feedback.');
    }

    // Urgency suggestions
    if (analysis.urgency === 'high' && analysis.intent === 'question') {
      suggestions.push('High urgency questions may benefit from clearer, more direct phrasing.');
    }

    return suggestions.length > 0 ? suggestions : ['Tone analysis looks good!'];
  }

  /**
   * Clear tone analysis cache
   */
  clearCache(): void {
    this.cache.flushAll();
    logger.info('Tone analysis cache cleared');
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

export const toneAnalysisService = new ToneAnalysisService();
