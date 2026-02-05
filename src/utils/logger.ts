import winston from 'winston';
import path from 'path';
import fs from 'fs';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Log directory (for local development only)
 */
const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// Ensure log directory exists (local development only)
if (process.env.NODE_ENV === 'development' && !fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (error) {
    console.warn(`Failed to create log directory: ${logDir}`, error);
  }
}

/**
 * Custom format for structured JSON logging
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    });
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  })
);

/**
 * Create transports based on environment
 */
const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    })
  );

  // File transport for local development only (Vercel handles logs in production)
  if (process.env.NODE_ENV === 'development' && process.env.LOG_TO_FILE === 'true') {
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: jsonFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return transports;
};

/**
 * Create Winston logger instance
 */
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: jsonFormat,
  defaultMeta: {
    service: 'ytu-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.API_VERSION || 'v1',
  },
  transports: createTransports(),
});

/**
 * Logger class with additional methods
 */
class Logger {
  /**
   * Log error with stack trace
   */
  error(message: string, meta?: any): void {
    winstonLogger.error(message, {
      ...meta,
      stack: meta?.error?.stack || (meta?.error instanceof Error ? meta.error.stack : undefined),
    });
  }

  /**
   * Log warning
   */
  warn(message: string, meta?: any): void {
    winstonLogger.warn(message, meta);
  }

  /**
   * Log info
   */
  info(message: string, meta?: any): void {
    winstonLogger.info(message, meta);
  }

  /**
   * Log debug (only in development)
   */
  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      winstonLogger.debug(message, meta);
    }
  }

  /**
   * Log request
   */
  request(message: string, meta?: any): void {
    winstonLogger.info(message, {
      ...meta,
      type: 'request',
    });
  }

  /**
   * Log response
   */
  response(message: string, meta?: any): void {
    winstonLogger.info(message, {
      ...meta,
      type: 'response',
    });
  }

  /**
   * Log performance metric
   */
  performance(message: string, meta?: any): void {
    winstonLogger.info(message, {
      ...meta,
      type: 'performance',
    });
  }

  /**
   * Log security event
   */
  security(message: string, meta?: any): void {
    winstonLogger.warn(message, {
      ...meta,
      type: 'security',
    });
  }

  /**
   * Get logger instance (for advanced usage)
   */
  getWinstonLogger(): winston.Logger {
    return winstonLogger;
  }
}

export const loggerInstance = new Logger();

// Export for backward compatibility
export const logger = loggerInstance;