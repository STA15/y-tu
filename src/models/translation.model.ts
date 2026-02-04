export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  userId?: string;
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  timestamp: string;
}

export interface LanguageDetectionResponse {
  language: string;
  confidence: number;
}

export interface SupportedLanguage {
  code: string;
  name: string;
}
