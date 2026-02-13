import { AppConfig, ConfigValidationResult } from './config.types';

/**
 * Validates configuration and ensures all required environment variables are present
 */
export class ConfigValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  validate(config: AppConfig): ConfigValidationResult {
    this.errors = [];
    this.warnings = [];

    // Validate server config
    this.validateServer(config.server);

    // Validate rate limit config
    this.validateRateLimit(config.rateLimit);

    // Validate CORS config
    this.validateCors(config.cors);

    // Validate AI services
    this.validateAIServices(config.aiServices);

    // Validate JWT config
    this.validateJWT(config.jwt);

    // Validate database (optional)
    if (config.database) {
      this.validateDatabase(config.database);
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  private validateServer(server: AppConfig['server']): void {
    if (!server.port || server.port < 1 || server.port > 65535) {
      this.errors.push('PORT must be a valid port number (1-65535)');
    }

    if (!['development', 'production', 'test'].includes(server.nodeEnv)) {
      this.errors.push('NODE_ENV must be one of: development, production, test');
    }

    if (!server.apiVersion || !server.apiVersion.match(/^v\d+$/)) {
      this.errors.push('API version must be in format v1, v2, etc.');
    }
  }

  private validateRateLimit(rateLimit: AppConfig['rateLimit']): void {
    if (rateLimit.windowMs <= 0) {
      this.errors.push('Rate limit window must be greater than 0');
    }

    if (rateLimit.maxRequests <= 0) {
      this.errors.push('Rate limit max requests must be greater than 0');
    }

    if (rateLimit.throttleWindowMs <= 0) {
      this.errors.push('Throttle window must be greater than 0');
    }

    if (rateLimit.throttleMaxRequests <= 0) {
      this.errors.push('Throttle max requests must be greater than 0');
    }
  }

  private validateCors(cors: AppConfig['cors']): void {
    if (!Array.isArray(cors.allowedOrigins) || cors.allowedOrigins.length === 0) {
      this.warnings.push('No CORS origins specified, defaulting to allow all');
    }

    if (!Array.isArray(cors.methods) || cors.methods.length === 0) {
      this.warnings.push('No CORS methods specified');
    }
  }

  private validateAIServices(aiServices: AppConfig['aiServices']): void {
    if (!aiServices.openaiApiKey || aiServices.openaiApiKey.trim() === '') {
      this.errors.push('OPENAI_API_KEY is required');
    }

    if (aiServices.openaiApiKey && aiServices.openaiApiKey.startsWith('your_')) {
      this.warnings.push('OPENAI_API_KEY appears to be a placeholder value');
    }
  }

  private validateJWT(jwt: AppConfig['jwt']): void {
    if (!jwt.secret || jwt.secret.trim() === '') {
      this.errors.push('JWT_SECRET is required');
    }

    if (jwt.secret.length < 32) {
      this.warnings.push('JWT_SECRET should be at least 32 characters long for security');
    }

    if (jwt.secret.includes('your-secret') || jwt.secret.includes('change-in-production')) {
      this.errors.push('JWT_SECRET must be changed from default value');
    }

    if (!jwt.expiresIn) {
      this.errors.push('JWT_EXPIRES_IN is required');
    }

    if (!jwt.refreshExpiresIn) {
      this.errors.push('JWT_REFRESH_EXPIRES_IN is required');
    }
  }

  private validateDatabase(database: AppConfig['database']): void {
    if (!database) {
      return; // Database is optional
    }
  
    // If MongoDB URI is provided, that's all we need
    if (database.mongoUri) {
      return; // Valid - using MongoDB
    }
  
    // If connection string is provided, it takes precedence
    if (database.connectionString) {
      if (!database.connectionString.startsWith('mongodb://') &&
          !database.connectionString.startsWith('mongodb+srv://') &&
          !database.connectionString.startsWith('postgresql://') &&
          !database.connectionString.startsWith('mysql://')) {
        this.warnings.push('Database connection string format may be invalid');
      }
    } else {
      // Validate individual database config
      if (!database.host) {
        this.warnings.push('Database host not specified');
      }
      if (!database.name) {
        this.warnings.push('Database name not specified');
      }
    }
  }}