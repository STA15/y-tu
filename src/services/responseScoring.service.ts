import { ResponseCandidate } from '../models/responseGeneration.model';
import { toneAnalysisService } from './toneAnalysis.service';
import { logger } from '../utils/logger';

/**
 * Response Scoring Service
 * Scores response candidates based on multiple criteria
 */
class ResponseScoringService {
  /**
   * Score a response candidate
   */
  async scoreResponse(
    responseText: string,
    originalMessage: string,
    targetLanguage?: string,
    context?: string
  ): Promise<ResponseCandidate['scores']> {
    try {
      // Analyze tone of the generated response
      const toneAnalysis = await toneAnalysisService.analyzeTone({
        text: responseText,
        language: targetLanguage,
        context
      });

      // Calculate scores
      const scores = {
        humanLikeness: this.calculateHumanLikeness(toneAnalysis),
        appropriateness: this.calculateAppropriateness(responseText, originalMessage, toneAnalysis),
        clarity: this.calculateClarity(responseText),
        culturalSensitivity: toneAnalysis.detailedAnalysis.culturalAppropriateness
      };

      return scores;
    } catch (error) {
      logger.error('Response scoring error', { error });
      // Return default scores on error
      return {
        humanLikeness: 70,
        appropriateness: 70,
        clarity: 70,
        culturalSensitivity: 70
      };
    }
  }

  /**
   * Calculate human-likeness score from tone analysis
   */
  private calculateHumanLikeness(toneAnalysis: any): number {
    // Use the tone score as human-likeness
    return toneAnalysis.toneScore;
  }

  /**
   * Calculate appropriateness score
   */
  private calculateAppropriateness(
    responseText: string,
    originalMessage: string,
    toneAnalysis: any
  ): number {
    let score = 80; // Base score

    // Check if response addresses the intent
    const intentMatch = this.checkIntentMatch(responseText, toneAnalysis.intent);
    score += intentMatch ? 10 : -10;

    // Check if urgency is addressed
    const urgencyMatch = this.checkUrgencyMatch(responseText, toneAnalysis.urgency);
    score += urgencyMatch ? 5 : -5;

    // Check if emotion is appropriate
    const emotionMatch = this.checkEmotionMatch(responseText, toneAnalysis.emotion);
    score += emotionMatch ? 5 : -5;

    // Check length appropriateness
    const lengthScore = this.checkLengthAppropriateness(responseText, originalMessage);
    score += lengthScore;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate clarity score
   */
  private calculateClarity(responseText: string): number {
    let score = 80; // Base score

    // Check sentence length (shorter is often clearer)
    const avgSentenceLength = this.getAverageSentenceLength(responseText);
    if (avgSentenceLength > 25) score -= 10;
    if (avgSentenceLength < 10) score -= 5;
    if (avgSentenceLength >= 10 && avgSentenceLength <= 20) score += 10;

    // Check for complex words
    const complexWordRatio = this.getComplexWordRatio(responseText);
    if (complexWordRatio > 0.3) score -= 10;
    if (complexWordRatio < 0.1) score += 5;

    // Check for clarity indicators
    if (this.hasClarityIndicators(responseText)) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if response matches the intent
   */
  private checkIntentMatch(responseText: string, intent: string): boolean {
    const lowerText = responseText.toLowerCase();
    
    switch (intent) {
      case 'question':
        return lowerText.includes('?') || 
               lowerText.includes('answer') || 
               lowerText.includes('explain');
      case 'complaint':
        return lowerText.includes('apolog') || 
               lowerText.includes('sorry') || 
               lowerText.includes('understand');
      case 'request':
        return lowerText.includes('will') || 
               lowerText.includes('can') || 
               lowerText.includes('help');
      case 'feedback':
        return lowerText.includes('thank') || 
               lowerText.includes('appreciate') || 
               lowerText.includes('value');
      default:
        return true;
    }
  }

  /**
   * Check if response matches urgency level
   */
  private checkUrgencyMatch(responseText: string, urgency: string): boolean {
    const lowerText = responseText.toLowerCase();
    
    switch (urgency) {
      case 'high':
        return lowerText.includes('immediately') || 
               lowerText.includes('urgent') || 
               lowerText.includes('as soon as') ||
               lowerText.includes('right away');
      case 'medium':
        return !lowerText.includes('immediately') && 
               !lowerText.includes('urgent');
      case 'low':
        return !lowerText.includes('urgent') && 
               !lowerText.includes('immediately');
      default:
        return true;
    }
  }

  /**
   * Check if response matches emotion
   */
  private checkEmotionMatch(responseText: string, emotion: string): boolean {
    const lowerText = responseText.toLowerCase();
    const positiveWords = ['thank', 'appreciate', 'glad', 'happy', 'pleased', 'excellent'];
    const negativeWords = ['sorry', 'apologize', 'regret', 'unfortunate', 'concern'];
    
    switch (emotion) {
      case 'positive':
        return positiveWords.some(word => lowerText.includes(word));
      case 'negative':
        return negativeWords.some(word => lowerText.includes(word)) ||
               lowerText.includes('understand') || 
               lowerText.includes('help');
      case 'neutral':
        return !positiveWords.some(word => lowerText.includes(word)) &&
               !negativeWords.some(word => lowerText.includes(word));
      default:
        return true;
    }
  }

  /**
   * Check length appropriateness
   */
  private checkLengthAppropriateness(responseText: string, originalMessage: string): number {
    const responseLength = responseText.length;
    const originalLength = originalMessage.length;
    const ratio = responseLength / originalLength;

    // Response should be similar length or slightly longer
    if (ratio >= 0.5 && ratio <= 2.0) return 10;
    if (ratio >= 0.3 && ratio <= 3.0) return 5;
    if (ratio < 0.2) return -10; // Too short
    if (ratio > 4.0) return -5; // Too long

    return 0;
  }

  /**
   * Get average sentence length
   */
  private getAverageSentenceLength(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    
    const totalWords = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0);
    return totalWords / sentences.length;
  }

  /**
   * Get complex word ratio
   */
  private getComplexWordRatio(text: string): number {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 0;
    
    const complexWords = words.filter(w => w.length > 6 || /[^a-z]/.test(w));
    return complexWords.length / words.length;
  }

  /**
   * Check for clarity indicators
   */
  private hasClarityIndicators(text: string): boolean {
    const clarityPhrases = [
      'in other words',
      'to clarify',
      'specifically',
      'for example',
      'that is'
    ];
    
    const lowerText = text.toLowerCase();
    return clarityPhrases.some(phrase => lowerText.includes(phrase));
  }

  /**
   * Calculate overall score from individual scores
   */
  calculateOverallScore(scores: ResponseCandidate['scores']): number {
    const weights = {
      humanLikeness: 0.35,
      appropriateness: 0.30,
      clarity: 0.20,
      culturalSensitivity: 0.15
    };

    const overall = 
      scores.humanLikeness * weights.humanLikeness +
      scores.appropriateness * weights.appropriateness +
      scores.clarity * weights.clarity +
      scores.culturalSensitivity * weights.culturalSensitivity;

    return Math.round(overall);
  }

  /**
   * Score a response candidate (wrapper that includes overall score)
   */
  async scoreCandidate(
    responseText: string,
    originalMessage: string,
    targetLanguage?: string,
    context?: string
  ): Promise<{ scores: ResponseCandidate['scores']; overall: number }> {
    const scores = await this.scoreResponse(responseText, originalMessage, targetLanguage, context);
    const overall = this.calculateOverallScore(scores);
    return { scores, overall };
  }
}

export const responseScoringService = new ResponseScoringService();
