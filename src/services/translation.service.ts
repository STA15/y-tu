import { AppError } from '../middleware/errorHandler';
import { TranslationRequest, TranslationResponse } from '../models/translation.model';
import { createTranslationClient, TranslationApiClient } from './translationApi.client';
import { retryWithBackoff } from '../utils/retry.util';
import { logger } from '../utils/logger';
import NodeCache from 'node-cache';

/**
 * Translation service with caching and retry logic
 */
class TranslationService {
  private apiClient: TranslationApiClient;
  private cache: NodeCache;
  private readonly MAX_TEXT_LENGTH = 5000;
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours

  constructor() {
    this.apiClient = createTranslationClient();
    this.cache = new NodeCache({
      stdTTL: this.CACHE_TTL,
      checkperiod: 60 * 60, // Check for expired keys every hour
      useClones: false
    });

    logger.info('Translation service initialized with caching');
  }

  /**
   * Generate cache key for translation
   */
  private getCacheKey(text: string, targetLanguage: string, sourceLanguage?: string): string {
    const normalizedText = text.toLowerCase().trim();
    const source = sourceLanguage || 'auto';
    return `translation:${source}:${targetLanguage}:${Buffer.from(normalizedText).toString('base64')}`;
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
   * Validate language code
   */
  private async validateLanguageCode(code: string, isTarget: boolean = true): Promise<void> {
    const supportedLanguages = await this.getSupportedLanguages();
    const languageCodes = supportedLanguages.map(lang => lang.code);
    
    if (!languageCodes.includes(code)) {
      const type = isTarget ? 'target' : 'source';
      throw new AppError(
        `Unsupported ${type} language: ${code}. Supported languages: ${languageCodes.join(', ')}`,
        400
      );
    }
  }

  /**
   * Translate text from source language to target language
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const { text, targetLanguage, sourceLanguage } = request;

      // Validate input
      this.validateTextLength(text);
      await this.validateLanguageCode(targetLanguage, true);
      
      if (sourceLanguage) {
        await this.validateLanguageCode(sourceLanguage, false);
      }

      // Check cache
      const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
      const cached = this.cache.get<TranslationResponse>(cacheKey);
      
      if (cached) {
        logger.debug('Translation cache hit', { cacheKey });
        return cached;
      }

      // Translate with retry logic
      const apiResponse = await retryWithBackoff(
        () => this.apiClient.translate(text, targetLanguage, sourceLanguage),
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2
        }
      );

      // Build response
      const response: TranslationResponse = {
        originalText: text,
        translatedText: apiResponse.translatedText,
        sourceLanguage: apiResponse.detectedSourceLanguage || sourceLanguage || 'auto',
        targetLanguage,
        confidence: apiResponse.confidence || 0.9,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, response);
      logger.debug('Translation cached', { cacheKey });

      return response;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Translation service error', { error });
      throw new AppError(
        `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Detect the language of the given text
   */
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      this.validateTextLength(text);

      // Check cache
      const cacheKey = `detect:${Buffer.from(text.toLowerCase().trim()).toString('base64')}`;
      const cached = this.cache.get<{ language: string; confidence: number }>(cacheKey);
      
      if (cached) {
        logger.debug('Language detection cache hit', { cacheKey });
        return cached;
      }

      // Detect with retry logic
      const result = await retryWithBackoff(
        () => this.apiClient.detectLanguage(text),
        {
          maxRetries: 2,
          initialDelay: 500,
          maxDelay: 5000
        }
      );

      // Cache the result
      this.cache.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      logger.error('Language detection error', { error });
      throw new AppError(
        `Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Get list of supported languages
   */
  async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    try {
      // Cache supported languages (longer TTL since they don't change often)
      const cacheKey = 'supported_languages';
      const cached = this.cache.get<Array<{ code: string; name: string }>>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Fetch with retry logic
      const languages = await retryWithBackoff(
        () => this.apiClient.getSupportedLanguages(),
        {
          maxRetries: 2,
          initialDelay: 500
        }
      );

      // Cache for 7 days
      this.cache.set(cacheKey, languages, 7 * 24 * 60 * 60);

      return languages;
    } catch (error) {
      logger.error('Get supported languages error', { error });
      // Return default languages as fallback
      return [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' }
      ];
    }
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.flushAll();
    logger.info('Translation cache cleared');
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

export const translationService = new TranslationService();
