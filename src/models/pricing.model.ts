import { ApiKeyTier } from './apiKey.model';

/**
 * Pricing plan features
 */
export interface PlanFeatures {
  // Rate Limits
  requestsPerDay: number;
  requestsPerMinute?: number;
  requestsPerSecond?: number;
  
  // Features
  translation: boolean;
  toneAnalysis: boolean;
  responseGeneration: boolean;
  fullProcessing: boolean;
  languageDetection: boolean;
  supportedLanguages: number;
  
  // Quality
  priorityProcessing: boolean;
  advancedFeatures: boolean;
  customModels: boolean;
  
  // Support
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  sla: boolean;
  dedicatedSupport: boolean;
  
  // Response Time
  avgResponseTime: string; // e.g., "< 500ms"
  maxResponseTime: string; // e.g., "< 2s"
  
  // Additional
  webhooks: boolean;
  analytics: boolean;
  customIntegrations: boolean;
}

/**
 * Pricing plan definition
 */
export interface PricingPlan {
  tier: ApiKeyTier;
  name: string;
  description: string;
  price: string; // e.g., "Free", "$9/month", "Custom"
  features: PlanFeatures;
  useCases: string[];
  examples: {
    title: string;
    description: string;
    code: string;
  }[];
}

/**
 * Pricing plans configuration
 */
export const PRICING_PLANS: Record<ApiKeyTier, PricingPlan> = {
  [ApiKeyTier.FREE]: {
    tier: ApiKeyTier.FREE,
    name: 'Free',
    description: 'Perfect for testing and small projects. Get started with basic translation and tone analysis.',
    price: 'Free',
    features: {
      requestsPerDay: 100,
      requestsPerMinute: 10,
      translation: true,
      toneAnalysis: true,
      responseGeneration: false,
      fullProcessing: false,
      languageDetection: true,
      supportedLanguages: 50,
      priorityProcessing: false,
      advancedFeatures: false,
      customModels: false,
      supportLevel: 'community',
      sla: false,
      dedicatedSupport: false,
      avgResponseTime: '< 1s',
      maxResponseTime: '< 3s',
      webhooks: false,
      analytics: false,
      customIntegrations: false,
    },
    useCases: [
      'Testing and development',
      'Small personal projects',
      'Learning and experimentation',
      'Proof of concept',
    ],
    examples: [
      {
        title: 'Basic Translation',
        description: 'Translate text from English to Spanish',
        code: `curl -X POST https://api.yutu.com/api/v1/translate \\
  -H "X-RapidAPI-Key: your-rapidapi-key" \\
  -H "X-RapidAPI-Host: yutu-api.p.rapidapi.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello, how can I help you?",
    "targetLanguage": "es",
    "sourceLanguage": "en"
  }'`,
      },
      {
        title: 'Tone Analysis',
        description: 'Analyze the tone of customer feedback',
        code: `curl -X POST https://api.yutu.com/api/v1/analyze-tone \\
  -H "X-RapidAPI-Key: your-rapidapi-key" \\
  -H "X-RapidAPI-Host: yutu-api.p.rapidapi.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "I am very satisfied with the service!",
    "language": "en",
    "context": "Customer feedback"
  }'`,
      },
    ],
  },
  [ApiKeyTier.STARTER]: {
    tier: ApiKeyTier.STARTER,
    name: 'Starter',
    description: 'Ideal for small businesses and startups. Includes all basic features with higher limits.',
    price: '$9/month',
    features: {
      requestsPerDay: 1000,
      requestsPerMinute: 50,
      translation: true,
      toneAnalysis: true,
      responseGeneration: true,
      fullProcessing: true,
      languageDetection: true,
      supportedLanguages: 100,
      priorityProcessing: false,
      advancedFeatures: false,
      customModels: false,
      supportLevel: 'email',
      sla: false,
      dedicatedSupport: false,
      avgResponseTime: '< 800ms',
      maxResponseTime: '< 2s',
      webhooks: false,
      analytics: true,
      customIntegrations: false,
    },
    useCases: [
      'Small business customer service',
      'Startup MVP',
      'Content localization',
      'Email automation',
    ],
    examples: [
      {
        title: 'Full Processing Pipeline',
        description: 'Translate, analyze tone, and generate response in one request',
        code: `curl -X POST https://api.yutu.com/api/v1/process \\
  -H "X-RapidAPI-Key: your-rapidapi-key" \\
  -H "X-RapidAPI-Host: yutu-api.p.rapidapi.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "I need help with my order",
    "sourceLanguage": "en",
    "targetLanguage": "es",
    "context": "E-commerce support",
    "options": {
      "translate": true,
      "analyzeTone": true,
      "generateResponse": true
    }
  }'`,
      },
      {
        title: 'Response Generation',
        description: 'Generate professional customer service responses',
        code: `curl -X POST https://api.yutu.com/api/v1/generate-response \\
  -H "X-RapidAPI-Key: your-rapidapi-key" \\
  -H "X-RapidAPI-Host: yutu-api.p.rapidapi.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "originalText": "When will my order arrive?",
    "context": "E-commerce inquiry",
    "tone": "professional",
    "language": "en"
  }'`,
      },
    ],
  },
  [ApiKeyTier.PRO]: {
    tier: ApiKeyTier.PRO,
    name: 'Pro',
    description: 'For growing businesses and high-volume applications. Priority processing and advanced features.',
    price: '$49/month',
    features: {
      requestsPerDay: 10000,
      requestsPerMinute: 200,
      requestsPerSecond: 10,
      translation: true,
      toneAnalysis: true,
      responseGeneration: true,
      fullProcessing: true,
      languageDetection: true,
      supportedLanguages: 150,
      priorityProcessing: true,
      advancedFeatures: true,
      customModels: false,
      supportLevel: 'priority',
      sla: true,
      dedicatedSupport: false,
      avgResponseTime: '< 500ms',
      maxResponseTime: '< 1.5s',
      webhooks: true,
      analytics: true,
      customIntegrations: true,
    },
    useCases: [
      'Enterprise customer service',
      'High-volume content processing',
      'Multi-language support systems',
      'Advanced AI applications',
    ],
    examples: [
      {
        title: 'High-Volume Translation',
        description: 'Process multiple translations with priority processing',
        code: `curl -X POST https://api.yutu.com/api/v1/translate \\
  -H "X-RapidAPI-Key: your-rapidapi-key" \\
  -H "X-RapidAPI-Host: yutu-api.p.rapidapi.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Welcome to our platform. We are excited to have you!",
    "targetLanguage": "fr",
    "sourceLanguage": "en"
  }'`,
      },
      {
        title: 'Advanced Tone Analysis',
        description: 'Deep analysis with cultural context awareness',
        code: `curl -X POST https://api.yutu.com/api/v1/analyze-tone \\
  -H "X-RapidAPI-Key: your-rapidapi-key" \\
  -H "X-RapidAPI-Host: yutu-api.p.rapidapi.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "This product exceeded my expectations in every way!",
    "language": "en",
    "context": "Product review with cultural context"
  }'`,
      },
    ],
  },
  [ApiKeyTier.ENTERPRISE]: {
    tier: ApiKeyTier.ENTERPRISE,
    name: 'Enterprise',
    description: 'Custom solutions for large organizations. Unlimited requests, dedicated support, and SLA guarantees.',
    price: 'Custom',
    features: {
      requestsPerDay: Infinity,
      requestsPerMinute: Infinity,
      requestsPerSecond: Infinity,
      translation: true,
      toneAnalysis: true,
      responseGeneration: true,
      fullProcessing: true,
      languageDetection: true,
      supportedLanguages: 200,
      priorityProcessing: true,
      advancedFeatures: true,
      customModels: true,
      supportLevel: 'dedicated',
      sla: true,
      dedicatedSupport: true,
      avgResponseTime: '< 300ms',
      maxResponseTime: '< 1s',
      webhooks: true,
      analytics: true,
      customIntegrations: true,
    },
    useCases: [
      'Large-scale enterprise applications',
      'Mission-critical systems',
      'Custom AI model training',
      'White-label solutions',
    ],
    examples: [
      {
        title: 'Enterprise Integration',
        description: 'Custom integration with dedicated endpoints',
        code: `curl -X POST https://api.yutu.com/api/v1/process \\
  -H "X-RapidAPI-Key: your-rapidapi-key" \\
  -H "X-RapidAPI-Host: yutu-api.p.rapidapi.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Enterprise message requiring high-quality translation and analysis",
    "sourceLanguage": "en",
    "targetLanguage": "ja",
    "context": "Enterprise customer communication",
    "options": {
      "translate": true,
      "analyzeTone": true,
      "generateResponse": true
    }
  }'`,
      },
      {
        title: 'Custom Model Usage',
        description: 'Use custom trained models for specific use cases',
        code: `curl -X POST https://api.yutu.com/api/v1/generate-response \\
  -H "X-RapidAPI-Key: your-rapidapi-key" \\
  -H "X-RapidAPI-Host: yutu-api.p.rapidapi.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "originalText": "Enterprise customer inquiry",
    "context": "Custom business context",
    "tone": "professional",
    "language": "en",
    "customModel": "enterprise-model-v1"
  }'`,
      },
    ],
  },
};

/**
 * Get pricing plan by tier
 */
export const getPricingPlan = (tier: ApiKeyTier): PricingPlan => {
  return PRICING_PLANS[tier];
}

/**
 * Get all pricing plans
 */
export const getAllPricingPlans = (): PricingPlan[] => {
  return Object.values(PRICING_PLANS);
}

/**
 * Compare plans
 */
export const comparePlans = (): {
  feature: string;
  free: any;
  starter: any;
  pro: any;
  enterprise: any;
}[] => {
  return [
    {
      feature: 'Requests per Day',
      free: '100',
      starter: '1,000',
      pro: '10,000',
      enterprise: 'Unlimited',
    },
    {
      feature: 'Translation',
      free: '✓',
      starter: '✓',
      pro: '✓',
      enterprise: '✓',
    },
    {
      feature: 'Tone Analysis',
      free: '✓',
      starter: '✓',
      pro: '✓',
      enterprise: '✓',
    },
    {
      feature: 'Response Generation',
      free: '✗',
      starter: '✓',
      pro: '✓',
      enterprise: '✓',
    },
    {
      feature: 'Full Processing',
      free: '✗',
      starter: '✓',
      pro: '✓',
      enterprise: '✓',
    },
    {
      feature: 'Priority Processing',
      free: '✗',
      starter: '✗',
      pro: '✓',
      enterprise: '✓',
    },
    {
      feature: 'Advanced Features',
      free: '✗',
      starter: '✗',
      pro: '✓',
      enterprise: '✓',
    },
    {
      feature: 'Custom Models',
      free: '✗',
      starter: '✗',
      pro: '✗',
      enterprise: '✓',
    },
    {
      feature: 'SLA Guarantee',
      free: '✗',
      starter: '✗',
      pro: '✓',
      enterprise: '✓',
    },
    {
      feature: 'Dedicated Support',
      free: '✗',
      starter: '✗',
      pro: '✗',
      enterprise: '✓',
    },
    {
      feature: 'Webhooks',
      free: '✗',
      starter: '✗',
      pro: '✓',
      enterprise: '✓',
    },
    {
      feature: 'Analytics',
      free: '✗',
      starter: '✓',
      pro: '✓',
      enterprise: '✓',
    },
  ];
};
