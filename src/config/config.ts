import dotenv from 'dotenv';
import { AppConfig, NodeEnv } from './config.types';
import { ConfigValidator } from './config.validator';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Parse comma-separated string to array
 */
const parseArray = (value: string | undefined, defaultValue: string[] = []): string[] => {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

/**
 * Parse boolean from environment variable
 */
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

/**
 * Parse integer from environment variable
 */
const parseIntSafe = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Application configuration
 */
export const config: AppConfig = {
  server: {
    port: parseIntSafe(process.env.PORT, 3000),
    nodeEnv: (process.env.NODE_ENV as NodeEnv) || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
    baseUrl: process.env.BASE_URL || process.env.VERCEL_URL || undefined
  },

  rateLimit: {
    windowMs: parseIntSafe(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000), // 1 minute default
    maxRequests: parseIntSafe(process.env.RATE_LIMIT_MAX_REQUESTS, 100), // 100 requests per minute
    throttleWindowMs: parseIntSafe(process.env.THROTTLE_WINDOW_MS, 1000), // 1 second default
    throttleMaxRequests: parseIntSafe(process.env.THROTTLE_MAX_REQUESTS, 50), // 50 requests per second
    message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP, please try again later.'
  },

  cors: {
    allowedOrigins: parseArray(
      process.env.ALLOWED_ORIGINS,
      process.env.NODE_ENV === 'production' ? [] : ['*']
    ),
    credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
    methods: parseArray(process.env.CORS_METHODS, ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
    allowedHeaders: parseArray(
      process.env.CORS_ALLOWED_HEADERS,
      ['Content-Type', 'Authorization', 'X-Requested-With']
    )
  },

  database: {
    mongoUri: process.env.MONGODB_URI,
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_CONNECTION_STRING,
    host: process.env.DATABASE_HOST,
    port: parseIntSafe(process.env.DATABASE_PORT, 5432),
    name: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    ssl: parseBoolean(process.env.DATABASE_SSL, process.env.NODE_ENV === 'production')
  },

  aiServices: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4',
    claudeApiKey: process.env.CLAUDE_API_KEY,
    translationServiceApiKey: process.env.TRANSLATION_SERVICE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY,
    translationServiceUrl: process.env.TRANSLATION_SERVICE_URL,
    translationProvider: (process.env.TRANSLATION_PROVIDER as 'google' | 'openai') || 'google',
    toneAnalysisProvider: (process.env.TONE_ANALYSIS_PROVIDER as 'openai' | 'claude') || 'openai'
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'ytu-api',
    audience: process.env.JWT_AUDIENCE || 'ytu-api-users'
  },

  vercel: {
    url: process.env.VERCEL_URL
  }
};

/**
 * Validate configuration on startup
 */
export const validateConfig = (): void => {
  const validator = new ConfigValidator();
  const result = validator.validate(config);

  if (result.errors.length > 0) {
    logger.error('Configuration validation failed:', { errors: result.errors });
    console.error('\n❌ Configuration Errors:');
    result.errors.forEach(error => console.error(`   - ${error}`));
    console.error('\nPlease fix the configuration errors before starting the server.\n');
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    logger.warn('Configuration warnings:', { warnings: result.warnings });
    console.warn('\n⚠️  Configuration Warnings:');
    result.warnings.forEach(warning => console.warn(`   - ${warning}`));
    console.warn('');
  }

  if (result.isValid && result.warnings.length === 0) {
    logger.info('Configuration validated successfully');
  }
};

/**
 * Helper functions for common config checks
 */
export const isProduction = (): boolean => config.server.nodeEnv === 'production';
export const isDevelopment = (): boolean => config.server.nodeEnv === 'development';
export const isTest = (): boolean => config.server.nodeEnv === 'test';

/**
 * Get API base path
 */
export const getApiBasePath = (): string => {
  return `/api/${config.server.apiVersion}`;
};

// Validate configuration when this module is imported (only in non-test environments)
// In test environments, validation can be called manually
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}