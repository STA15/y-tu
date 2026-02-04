import { config } from '../config/config';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { ToneAnalysisResponse } from '../models/toneAnalysis.model';
import { ResponseStyle } from '../models/responseGeneration.model';

/**
 * AI Response Generation Client Interface
 */
export interface AIResponseGenerationRequest {
  originalMessage: string;
  toneAnalysis?: ToneAnalysisResponse;
  businessContext?: string;
  targetLanguage?: string;
  responseStyle?: ResponseStyle;
  numCandidates?: number; // Number of candidates to generate
}

export interface AIResponseCandidate {
  text: string;
  reasoning?: string;
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
 * OpenAI Response Generation Client
 */
export class OpenAIResponseGenerationClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = config.aiServices.openaiApiKey || '';
    this.model = config.aiServices.openaiModel || 'gpt-4';
  }

  async generateCandidates(request: AIResponseGenerationRequest): Promise<AIResponseCandidate[]> {
    if (!this.apiKey) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    const numCandidates = request.numCandidates || 5;

    try {
      const systemPrompt = this.buildSystemPrompt(request);
      const userPrompt = this.buildUserPrompt(request);

      // Generate multiple candidates in parallel
      const candidatePromises = Array.from({ length: numCandidates }, (_, i) =>
        this.generateSingleCandidate(systemPrompt, userPrompt, i)
      );

      const candidates = await Promise.all(candidatePromises);
      
      // Filter out duplicates and invalid responses
      return this.deduplicateCandidates(candidates);
    } catch (error: any) {
      logger.error('OpenAI response generation error', { error: error.message });
      throw new AppError(`Response generation API error: ${error.message}`, 500);
    }
  }

  private async generateSingleCandidate(
    systemPrompt: string,
    userPrompt: string,
    variant: number
  ): Promise<AIResponseCandidate> {
    const variantPrompt = variant > 0 
      ? `\n\nGenerate a different variation (variant ${variant + 1}). Vary the phrasing, structure, or approach while maintaining the same intent and quality.`
      : '';

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
          { role: 'user', content: userPrompt + variantPrompt }
        ],
        temperature: 0.7 + (variant * 0.1), // Vary temperature for diversity
        max_tokens: 500,
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

    try {
      const parsed = JSON.parse(content);
      return {
        text: parsed.response || parsed.text || content,
        reasoning: parsed.reasoning
      };
    } catch {
      // If not JSON, treat as plain text
      return { text: content.trim() };
    }
  }

  private buildSystemPrompt(request: AIResponseGenerationRequest): string {
    const { toneAnalysis, businessContext, targetLanguage, responseStyle } = request;

    let prompt = `You are an expert in generating human-like, appropriate responses for business communication.

Your task is to generate a natural, contextually appropriate response to the given message.

Requirements:
- Generate responses that sound natural and human-like
- Match the appropriate tone and formality level
- Be culturally sensitive and appropriate
- Be clear and concise
- Address the intent appropriately`;

    if (toneAnalysis) {
      prompt += `\n\nTone Analysis:
- Formality Level: ${toneAnalysis.formality}/10
- Emotion: ${toneAnalysis.emotion}
- Urgency: ${toneAnalysis.urgency}
- Intent: ${toneAnalysis.intent}
- Match the formality and emotional tone appropriately`;
    }

    if (businessContext) {
      prompt += `\n\nBusiness Context: ${businessContext}`;
    }

    if (targetLanguage) {
      prompt += `\n\nTarget Language: ${targetLanguage} (respond in this language)`;
    }

    if (responseStyle) {
      prompt += `\n\nResponse Style: ${responseStyle}`;
    }

    prompt += `\n\nReturn your response as JSON: {"response": "<your response>", "reasoning": "<brief explanation>"}`;

    return prompt;
  }

  private buildUserPrompt(request: AIResponseGenerationRequest): string {
    const { originalMessage, toneAnalysis } = request;

    let prompt = `Generate an appropriate response to the following message:\n\n"${originalMessage}"`;

    if (toneAnalysis) {
      prompt += `\n\nBased on the tone analysis, generate a response that:
- Matches the formality level (${toneAnalysis.formality}/10)
- Appropriately addresses the ${toneAnalysis.emotion} emotion
- Handles the ${toneAnalysis.urgency} urgency level
- Responds to the ${toneAnalysis.intent} intent`;
    }

    return prompt;
  }

  private deduplicateCandidates(candidates: AIResponseCandidate[]): AIResponseCandidate[] {
    const seen = new Set<string>();
    const unique: AIResponseCandidate[] = [];

    for (const candidate of candidates) {
      const normalized = candidate.text.toLowerCase().trim();
      if (!seen.has(normalized) && candidate.text.length > 10) {
        seen.add(normalized);
        unique.push(candidate);
      }
    }

    return unique;
  }
}

/**
 * Claude Response Generation Client (Alternative)
 */
export class ClaudeResponseGenerationClient {
  private apiKey: string;
  private model: string = 'claude-3-opus-20240229';
  private baseUrl: string = 'https://api.anthropic.com/v1/messages';

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || '';
  }

  async generateCandidates(request: AIResponseGenerationRequest): Promise<AIResponseCandidate[]> {
    if (!this.apiKey) {
      throw new AppError('Claude API key not configured', 500);
    }

    // TODO: Implement Claude API integration
    throw new AppError('Claude API integration not yet implemented', 501);
  }
}

/**
 * Factory function to create AI response generation client
 */
export const createAIResponseGenerationClient = (): OpenAIResponseGenerationClient | ClaudeResponseGenerationClient => {
  const provider = process.env.RESPONSE_GENERATION_PROVIDER || 'openai';
  
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIResponseGenerationClient();
    case 'claude':
      return new ClaudeResponseGenerationClient();
    default:
      logger.warn(`Unknown response generation provider: ${provider}. Using OpenAI.`);
      return new OpenAIResponseGenerationClient();
  }
};