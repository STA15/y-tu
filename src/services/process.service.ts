import { AppError } from '../middleware/errorHandler';
import { translationService } from './translation.service';
import { toneAnalysisService } from './toneAnalysis.service';
import { generateResponseService } from './generateResponse.service';
import { logger } from '../utils/logger';

export interface ProcessRequest {
  text: string;
  targetLanguage?: string;
  sourceLanguage?: string;
  context?: string;
  options?: {
    analyzeTone?: boolean;
    translate?: boolean;
    generateResponse?: boolean;
  };
  userId?: string;
}

export interface ProcessResponse {
  originalText: string;
  translation?: {
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    confidence: number;
  };
  toneAnalysis?: {
    isHuman: boolean;
    confidence: number;
    analysis: {
      naturalness: number;
      coherence: number;
      emotionalMarkers: number;
    };
  };
  generatedResponse?: {
    response: string;
    score: number;
  };
  timestamp: string;
}

class ProcessService {
  async process(request: ProcessRequest): Promise<ProcessResponse> {
    try {
      const { text, targetLanguage, sourceLanguage, context, options = {}, userId } = request;
      
      // Default: perform all operations if no options specified
      const shouldTranslate = options.translate !== false;
      const shouldAnalyzeTone = options.analyzeTone !== false;
      const shouldGenerateResponse = options.generateResponse === true;

      const result: ProcessResponse = {
        originalText: text,
        timestamp: new Date().toISOString()
      };

      let processedText = text;

      // Perform translation if requested
      if (shouldTranslate && targetLanguage) {
        try {
          const translation = await translationService.translate({
            text,
            targetLanguage,
            sourceLanguage,
            userId
          });
          result.translation = {
            translatedText: translation.translatedText,
            sourceLanguage: translation.sourceLanguage,
            targetLanguage: translation.targetLanguage,
            confidence: translation.confidence
          };
          processedText = translation.translatedText;
        } catch (error) {
          logger.error('Translation failed in process service', { error });
        }
      }

      // Perform tone analysis if requested
      if (shouldAnalyzeTone) {
        try {
          const toneAnalysis = await toneAnalysisService.analyzeTone({
            text: processedText,
            userId
          });
          
          result.toneAnalysis = {
            isHuman: toneAnalysis.toneScore >= 70,
            confidence: toneAnalysis.toneScore / 100,
            analysis: {
              naturalness: toneAnalysis.detailedAnalysis.naturalness / 100,
              coherence: toneAnalysis.detailedAnalysis.contextRelevance / 100,
              emotionalMarkers: toneAnalysis.detailedAnalysis.emotionalAppropriateness / 100
            }
          };
        } catch (error) {
          logger.error('Tone analysis failed in process service', { error });
        }
      }

      // Generate response if requested
      if (shouldGenerateResponse) {
        try {
          const toneAnalysisResult = result.toneAnalysis ? {
            toneScore: result.toneAnalysis.analysis.naturalness * 100,
            formality: 5,
            emotion: 'neutral' as const,
            urgency: 'medium' as const,
            intent: 'other' as const,
            suggestions: [],
            detailedAnalysis: {
              naturalness: result.toneAnalysis.analysis.naturalness * 100,
              emotionalAppropriateness: result.toneAnalysis.analysis.emotionalMarkers * 100,
              contextRelevance: result.toneAnalysis.analysis.coherence * 100,
              culturalAppropriateness: 75
            },
            timestamp: new Date().toISOString()
          } : undefined;

          const generatedResponse = await generateResponseService.generate({
            originalMessage: processedText,
            toneAnalysis: toneAnalysisResult,
            businessContext: context,
            targetLanguage: targetLanguage,
            userId
          });

          result.generatedResponse = {
            response: generatedResponse.response,
            score: generatedResponse.score
          };
        } catch (error) {
          logger.error('Response generation failed in process service', { error });
        }
      }

      return result;
    } catch (error) {
      logger.error('Processing service error', { error });
      throw new AppError('Processing service error', 500);
    }
  }
}

export const processService = new ProcessService();