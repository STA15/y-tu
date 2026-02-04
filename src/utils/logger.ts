import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
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
 * Log directory
 */
const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
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

  // File transports (only in production or if LOG_TO_FILE is enabled)
  if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
    // Error log file
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: jsonFormat,
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true,
      })
    );

    // Combined log file
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        format: jsonFormat,
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true,
      })
    );

    // Request log file
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'requests-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        format: jsonFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
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
  // Handle exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
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