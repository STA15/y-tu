import { config } from '../config/config';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Translation API client interface
 */
export interface TranslationApiResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
  confidence?: number;
}

export interface LanguageDetectionResponse {
  language: string;
  confidence: number;
}

export interface SupportedLanguage {
  code: string;
  name: string;
}

interface GoogleTranslateError {
  error?: {
    message?: string;
  };
}

interface GoogleTranslateResponse {
  data?: {
    translations?: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
    detections?: Array<Array<{
      language: string;
      confidence?: number;
    }>>;
    languages?: Array<{
      language: string;
      name: string;
    }>;
  };
}

/**
 * Abstract translation API client
 */
export abstract class TranslationApiClient {
  abstract translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationApiResponse>;

  abstract detectLanguage(text: string): Promise<LanguageDetectionResponse>;

  abstract getSupportedLanguages(): Promise<SupportedLanguage[]>;
}

/**
 * Check if we should use mock services
 */
const shouldUseMock = (): boolean => {
  return process.env.USE_MOCK_SERVICES === 'true' || 
         !config.aiServices.translationServiceApiKey || 
         config.aiServices.translationServiceApiKey === 'mock_development_key';
};

/**
 * Google Cloud Translation API client
 */
export class GoogleTranslateClient extends TranslationApiClient {
  private apiKey: string;
  private baseUrl: string = 'https://translation.googleapis.com/language/translate/v2';
  private useMock: boolean;

  constructor() {
    super();
    this.useMock = shouldUseMock();
    this.apiKey = config.aiServices.translationServiceApiKey || config.aiServices.openaiApiKey || '';

    if (this.useMock) {
      logger.info('Translation service using MOCK mode (free testing)');
    } else if (!this.apiKey) {
      logger.warn('Translation API key not configured. Using fallback implementation.');
    }
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationApiResponse> {
    // Use mock/fallback if enabled
    if (this.useMock || !this.apiKey) {
      return this.fallbackTranslate(text, targetLanguage, sourceLanguage);
    }

    try {
      const url = `${this.baseUrl}?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
          source: sourceLanguage || undefined,
          format: 'text'
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } })) as GoogleTranslateError;
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json() as GoogleTranslateResponse;
      const translation = data.data?.translations?.[0];

      if (!translation) {
        throw new Error('Invalid response from translation API');
      }

      return {
        translatedText: translation.translatedText,
        detectedSourceLanguage: translation.detectedSourceLanguage,
        confidence: 0.95
      };
    } catch (error: any) {
      logger.error('Google Translate API error', { error: error.message });
      // Fallback to mock on error
      logger.warn('Falling back to mock translation');
      return this.fallbackTranslate(text, targetLanguage, sourceLanguage);
    }
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResponse> {
    if (this.useMock || !this.apiKey) {
      return this.fallbackDetectLanguage(text);
    }

    try {
      const url = `${this.baseUrl}/detect?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as GoogleTranslateResponse;
      const detection = data.data?.detections?.[0]?.[0];

      if (!detection) {
        throw new Error('Language detection failed');
      }

      return {
        language: detection.language,
        confidence: detection.confidence || 0.9
      };
    } catch (error: any) {
      logger.error('Language detection error', { error: error.message });
      return this.fallbackDetectLanguage(text);
    }
  }

  async getSupportedLanguages(): Promise<SupportedLanguage[]> {
    if (this.useMock || !this.apiKey) {
      return getDefaultSupportedLanguages();
    }

    try {
      const url = `${this.baseUrl}/languages?key=${this.apiKey}&target=en`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as GoogleTranslateResponse;
      return data.data?.languages?.map((lang: any) => ({
        code: lang.language,
        name: lang.name
      })) || getDefaultSupportedLanguages();
    } catch (error: any) {
      logger.error('Get supported languages error', { error: error.message });
      return getDefaultSupportedLanguages();
    }
  }

  /**
   * Fallback translation (for development/testing - FREE!)
   */
  private fallbackTranslate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): TranslationApiResponse {
    // Simple mock translations for common languages
    const mockTranslations: Record<string, string> = {
      es: `¡Hola! [Mock ES translation of: ${text}]`,
      fr: `Bonjour! [Mock FR translation of: ${text}]`,
      de: `Hallo! [Mock DE translation of: ${text}]`,
      it: `Ciao! [Mock IT translation of: ${text}]`,
      pt: `Olá! [Mock PT translation of: ${text}]`,
      ru: `Привет! [Mock RU translation of: ${text}]`,
      ja: `こんにちは! [Mock JA translation of: ${text}]`,
      zh: `你好! [Mock ZH translation of: ${text}]`,
      ko: `안녕하세요! [Mock KO translation of: ${text}]`,
      ar: `مرحبا! [Mock AR translation of: ${text}]`,
    };

    const translatedText = mockTranslations[targetLanguage] || `[${targetLanguage}] ${text}`;

    return {
      translatedText,
      detectedSourceLanguage: sourceLanguage || 'en',
      confidence: 0.85
    };
  }

  /**
   * Fallback language detection
   */
  private fallbackDetectLanguage(text: string): LanguageDetectionResponse {
    // Simple heuristic: check for common patterns
    if (/[\u4e00-\u9fff]/.test(text)) return { language: 'zh', confidence: 0.7 };
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return { language: 'ja', confidence: 0.7 };
    if (/[\uac00-\ud7a3]/.test(text)) return { language: 'ko', confidence: 0.7 };
    if (/[\u0600-\u06ff]/.test(text)) return { language: 'ar', confidence: 0.7 };

    return { language: 'en', confidence: 0.5 };
  }
}

/**
 * Default supported languages (exported function instead of private method)
 */
export function getDefaultSupportedLanguages(): SupportedLanguage[] {
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

/**
 * OpenAI-based translation client (alternative)
 */
export class OpenAITranslateClient extends TranslationApiClient {
  private apiKey: string;
  private model: string;

  constructor() {
    super();
    this.apiKey = config.aiServices.openaiApiKey || '';
    this.model = config.aiServices.openaiModel || 'gpt-4';
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationApiResponse> {
    if (!this.apiKey) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    // TODO: Implement OpenAI translation
    // This would use the OpenAI API to translate text
    throw new AppError('OpenAI translation not yet implemented', 501);
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResponse> {
    // TODO: Implement language detection using OpenAI
    throw new AppError('OpenAI language detection not yet implemented', 501);
  }

  async getSupportedLanguages(): Promise<SupportedLanguage[]> {
    // OpenAI supports all languages
    return getDefaultSupportedLanguages();
  }
}

/**
 * Factory function to create translation client
 */
export const createTranslationClient = (): TranslationApiClient => {
  const provider = process.env.TRANSLATION_PROVIDER || 'google';

  switch (provider.toLowerCase()) {
    case 'google':
      return new GoogleTranslateClient();
    case 'openai':
      return new OpenAITranslateClient();
    default:
      logger.warn(`Unknown translation provider: ${provider}. Using Google.`);
      return new GoogleTranslateClient();
  }
};