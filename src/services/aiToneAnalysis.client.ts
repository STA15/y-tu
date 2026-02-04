import { config } from '../config/config';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { ToneAnalysisResponse, EmotionType, UrgencyLevel, IntentType } from '../models/toneAnalysis.model';

/**
 * AI Tone Analysis Client Interface
 */
export interface AIToneAnalysisResponse {
  toneScore: number;
  formality: number;
  emotion: EmotionType;
  urgency: UrgencyLevel;
  intent: IntentType;
  suggestions: string[];
  culturalContext?: {
    detectedCulture?: string;
    culturalAppropriateness: number;
    notes?: string;
  };
  detailedAnalysis: {
    naturalness: number;
    emotionalAppropriateness: number;
    contextRelevance: number;
    culturalAppropriateness: number;
  };
}

interface OpenAIError {
  error?: {
    message?: string;
  };
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/**
 * OpenAI Tone Analysis Client
 */
export class OpenAIToneAnalysisClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = config.aiServices.openaiApiKey || '';
    this.model = config.aiServices.openaiModel || 'gpt-4';
  }

  async analyzeTone(
    text: string,
    language?: string,
    context?: string
  ): Promise<AIToneAnalysisResponse> {
    if (!this.apiKey) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(language);
      const userPrompt = this.buildUserPrompt(text, context);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } })) as OpenAIError;
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json() as OpenAIResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Invalid response from OpenAI API');
      }

      const analysis = JSON.parse(content);
      return this.normalizeResponse(analysis);
    } catch (error: any) {
      logger.error('OpenAI tone analysis error', { error: error.message });
      throw new AppError(`Tone analysis API error: ${error.message}`, 500);
    }
  }

  private buildSystemPrompt(language?: string): string {
    return `You are an expert in tone analysis and human communication. Analyze the given text and provide a comprehensive tone analysis.

Your response must be a valid JSON object with the following structure:
{
  "toneScore": <number 0-100>, // Overall human-likeness score
  "formality": <number 1-10>, // Formality level (1=very casual, 10=very formal)
  "emotion": "<positive|neutral|negative|mixed>",
  "urgency": "<low|medium|high>",
  "intent": "<question|complaint|request|feedback|statement|other>",
  "suggestions": [<array of improvement suggestions>],
  "culturalContext": {
    "detectedCulture": "<culture code if detected>",
    "culturalAppropriateness": <number 0-100>,
    "notes": "<optional notes>"
  },
  "detailedAnalysis": {
    "naturalness": <number 0-100>, // Natural language patterns
    "emotionalAppropriateness": <number 0-100>, // Appropriate emotional tone
    "contextRelevance": <number 0-100>, // Context relevance
    "culturalAppropriateness": <number 0-100> // Cultural appropriateness
  }
}

Consider:
- Natural language patterns and sentence structure
- Emotional markers and appropriateness
- Context relevance and coherence
- Cultural context and appropriateness${language ? `\n- Language: ${language}` : ''}
- Formality level appropriate for context
- Clear intent and purpose
- Human-like communication patterns

Provide actionable suggestions for improvement if the tone score is below 70.`;
  }

  private buildUserPrompt(text: string, context?: string): string {
    let prompt = `Analyze the tone of the following text:\n\n"${text}"`;
    
    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt += '\n\nProvide a comprehensive tone analysis in JSON format.';
    
    return prompt;
  }

  private normalizeResponse(analysis: any): AIToneAnalysisResponse {
    // Ensure all required fields are present and valid
    return {
      toneScore: this.clamp(analysis.toneScore || 50, 0, 100),
      formality: this.clamp(analysis.formality || 5, 1, 10),
      emotion: this.validateEnum(analysis.emotion, ['positive', 'neutral', 'negative', 'mixed'], 'neutral') as EmotionType,
      urgency: this.validateEnum(analysis.urgency, ['low', 'medium', 'high'], 'medium') as UrgencyLevel,
      intent: this.validateEnum(analysis.intent, ['question', 'complaint', 'request', 'feedback', 'statement', 'other'], 'other') as IntentType,
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
      culturalContext: analysis.culturalContext || {
        culturalAppropriateness: 75
      },
      detailedAnalysis: {
        naturalness: this.clamp(analysis.detailedAnalysis?.naturalness || 70, 0, 100),
        emotionalAppropriateness: this.clamp(analysis.detailedAnalysis?.emotionalAppropriateness || 70, 0, 100),
        contextRelevance: this.clamp(analysis.detailedAnalysis?.contextRelevance || 70, 0, 100),
        culturalAppropriateness: this.clamp(analysis.detailedAnalysis?.culturalAppropriateness || 70, 0, 100)
      }
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private validateEnum<T extends string>(value: any, validValues: T[], defaultValue: T): T {
    return validValues.includes(value) ? value : defaultValue;
  }
}

/**
 * Claude Tone Analysis Client (Alternative)
 */
export class ClaudeToneAnalysisClient {
  private apiKey: string;
  private model: string = 'claude-3-opus-20240229';
  private baseUrl: string = 'https://api.anthropic.com/v1/messages';

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || '';
  }

  async analyzeTone(
    text: string,
    language?: string,
    context?: string
  ): Promise<AIToneAnalysisResponse> {
    if (!this.apiKey) {
      throw new AppError('Claude API key not configured', 500);
    }

    // TODO: Implement Claude API integration
    // Similar structure to OpenAI client
    throw new AppError('Claude API integration not yet implemented', 501);
  }
}

/**
 * Factory function to create AI tone analysis client
 */
export const createAIToneAnalysisClient = (): OpenAIToneAnalysisClient | ClaudeToneAnalysisClient => {
  const provider = process.env.TONE_ANALYSIS_PROVIDER || 'openai';
  
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIToneAnalysisClient();
    case 'claude':
      return new ClaudeToneAnalysisClient();
    default:
      logger.warn(`Unknown tone analysis provider: ${provider}. Using OpenAI.`);
      return new OpenAIToneAnalysisClient();
  }
};