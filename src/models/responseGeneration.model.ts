/**
 * Response Generation Models
 */

import { ToneAnalysisResponse } from './toneAnalysis.model';

export type ResponseStyle = 'professional' | 'casual' | 'friendly' | 'formal' | 'creative' | 'empathetic' | 'concise';

export interface GenerateResponseRequest {
  originalMessage: string; // Original message (translated if needed)
  toneAnalysis?: ToneAnalysisResponse; // Tone analysis results
  businessContext?: string; // Business context
  targetLanguage?: string; // ISO 639-1 code
  responseStyle?: ResponseStyle; // Response style preferences
  userId?: string;
}

export interface ResponseCandidate {
  text: string;
  score: number; // 0-100 overall score
  scores: {
    humanLikeness: number; // 0-100
    appropriateness: number; // 0-100
    clarity: number; // 0-100
    culturalSensitivity: number; // 0-100
  };
}

export interface GenerateResponseResponse {
  response: string; // Best response
  score: number; // 0-100 confidence score
  alternatives: Array<{
    text: string;
    score: number;
  }>; // Alternative responses with scores
  language: string; // Target language
  metadata: {
    totalCandidates: number;
    generationTime: number; // milliseconds
    model?: string;
  };
  timestamp: string;
}
