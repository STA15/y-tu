/**
 * TypeScript types and interfaces for configuration
 */

export type NodeEnv = 'development' | 'production' | 'test';

export interface ServerConfig {
  port: number;
  nodeEnv: NodeEnv;
  apiVersion: string;
  baseUrl?: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  throttleWindowMs: number;
  throttleMaxRequests: number;
  message: string;
}

export interface CorsConfig {
  allowedOrigins: string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

export interface DatabaseConfig {
  mongoUri?: string;
  connectionString?: string;
  host?: string;
  port?: number;
  name?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}

export interface AIServiceConfig {
  openaiApiKey: string;
  openaiModel?: string;
  claudeApiKey?: string;
  translationServiceApiKey?: string;
  translationServiceUrl?: string;
  translationProvider?: 'google' | 'openai';
  toneAnalysisProvider?: 'openai' | 'claude';
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer?: string;
  audience?: string;
}

export interface AppConfig {
  server: ServerConfig;
  rateLimit: RateLimitConfig;
  cors: CorsConfig;
  database?: DatabaseConfig;
  aiServices: AIServiceConfig;
  jwt: JWTConfig;
  vercel?: {
    url?: string;
  };
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}