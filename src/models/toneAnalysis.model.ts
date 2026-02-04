/**
 * Tone Analysis Models
 */

export type EmotionType = 'positive' | 'neutral' | 'negative' | 'mixed';
export type UrgencyLevel = 'low' | 'medium' | 'high';
export type IntentType = 'question' | 'complaint' | 'request' | 'feedback' | 'statement' | 'other';

export interface ToneAnalysisRequest {
  text: string;
  language?: string; // ISO 639-1 code
  context?: string; // Additional context for analysis
  userId?: string;
}

export interface ToneAnalysisResponse {
  toneScore: number; // 0-100 human-likeness score
  formality: number; // 1-10 formality level
  emotion: EmotionType;
  urgency: UrgencyLevel;
  intent: IntentType;
  suggestions: string[]; // Improvement suggestions
  culturalContext?: {
    detectedCulture?: string;
    culturalAppropriateness: number; // 0-100
    notes?: string;
  };
  detailedAnalysis: {
    naturalness: number; // 0-100
    emotionalAppropriateness: number; // 0-100
    contextRelevance: number; // 0-100
    culturalAppropriateness: number; // 0-100
  };
  timestamp: string;
}

export interface HumanLikenessScore {
  overall: number; // 0-100
  naturalLanguagePatterns: number; // 0-100
  emotionalTone: number; // 0-100
  contextRelevance: number; // 0-100
  culturalAppropriateness: number; // 0-100
}
