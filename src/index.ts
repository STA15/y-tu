import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { config, getApiBasePath, isDevelopment } from './config/config';
import { securityHeaders, customSecurityHeaders } from './middleware/securityHeaders';
import { requestLogger, errorLogger } from './middleware/requestLogger';
import { sanitizeRequest } from './middleware/requestSanitization';
import { slowDownMiddleware } from './middleware/slowDown';
import { 
  globalTokenBucketLimiter, 
  perIpTokenBucketLimiter, 
  throttleTokenBucketLimiter 
} from './middleware/tokenBucketRateLimiter';
import { csrfMiddleware } from './middleware/csrfProtection';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestStartTimeMiddleware, sendSuccess } from './utils/response';
import { initSentry } from './utils/sentry';
import v1Routes from './routes/v1';
import authRoutes from './routes/auth.routes';
import { logger } from './utils/logger';

console.log('✅ 1. All imports loaded successfully');

// Initialize Sentry for error tracking (before app initialization)
if (process.env.SENTRY_DSN) {
  console.log('🔧 Initializing Sentry...');
  initSentry();
}

console.log('✅ 2. About to create Express app');
const app: Application = express();
console.log('✅ 3. Express app created');

// ============================================
// Security Middleware (Order Matters!)
// ============================================

console.log('🔧 4. Applying middleware...');

// 0. Request ID and timing (very first)
app.use(requestStartTimeMiddleware);

// 0.5. RapidAPI authentication (before other auth, if enabled)
if (process.env.RAPIDAPI_ENABLED === 'true') {
  const { optionalRapidAPIAuth } = require('./middleware/rapidapiAuth');
  app.use(optionalRapidAPIAuth);
}

// 1. Request logging (first, to log everything)
app.use(requestLogger);

// 2. Security headers (helmet with CSP)
app.use(securityHeaders);
app.use(customSecurityHeaders);

// 3. CORS configuration
app.use(cors({
  origin: config.cors.allowedOrigins.length > 0 && !config.cors.allowedOrigins.includes('*')
    ? config.cors.allowedOrigins
    : '*',
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));

// 4. Compression middleware (gzip responses)
app.use(compression({
  level: 6, // Compression level (1-9, 6 is good balance)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter
    return compression.filter(req, res);
  }
}));

// 5. Cookie parser (needed for CSRF)
app.use(cookieParser());

// 6. Request sanitization (SQL injection, XSS, NoSQL injection prevention)
app.use(sanitizeRequest);

// 7. Slow down middleware (DDoS protection)
app.use(slowDownMiddleware);

// 8. Token Bucket rate limiters (in order: global, per-IP, throttle)
app.use(globalTokenBucketLimiter);
app.use(perIpTokenBucketLimiter);
app.use(throttleTokenBucketLimiter);

// 9. Legacy rate limiter (for backward compatibility)
app.use(rateLimiter);

// 10. CSRF protection (for non-API routes)
app.use(csrfMiddleware);

// Body parsing middleware (after security checks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('✅ 5. All middleware applied');

// Root health check (backward compatibility)
app.get('/health', (req: Request, res: Response) => {
  sendSuccess(req, res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    apiVersion: config.server.apiVersion
  });
});

console.log('✅ 6. Health check route registered');

// API routes - versioned
console.log('🔧 7. Loading routes...');
const apiBasePath = getApiBasePath();
console.log('✅ 8. API base path:', apiBasePath);

console.log('🔧 9. Loading v1 routes...');
app.use(apiBasePath, v1Routes);
console.log('✅ 10. V1 routes loaded');

console.log('🔧 11. Loading auth routes...');
app.use(`${apiBasePath}/auth`, authRoutes);
console.log('✅ 12. Auth routes loaded');

// 404 handler
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Error handling middleware (must be last)
app.use(errorHandler);

console.log('✅ 13. All routes and error handlers registered');

// Start server
console.log('🔧 14. Preparing to start server...');
console.log('🔧 15. isDevelopment():', isDevelopment());
console.log('🔧 16. require.main === module:', require.main === module);

if (isDevelopment() || require.main === module) {
  console.log('✅ 17. Starting server on port', config.server.port);
  
  const server = app.listen(config.server.port, () => {
    console.log('✅ 18. Server started successfully!');
    logger.info(`✅ Server is running on port ${config.server.port}`);
    logger.info(`📍 Environment: ${config.server.nodeEnv}`);
    logger.info(`🔖 API Version: ${config.server.apiVersion}`);
    logger.info(`🌐 API Base Path: ${apiBasePath}`);
    
    if (isDevelopment()) {
      logger.info(`❤️  Health check: http://localhost:${config.server.port}/health`);
      logger.info(`🚀 API endpoints: http://localhost:${config.server.port}${apiBasePath}`);
    }
  }).on('error', (error: any) => {
    console.error('❌ 19. Server error occurred:', error.message);
    if (error.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${config.server.port} is already in use`);
      console.error(`\n❌ ERROR: Port ${config.server.port} is already in use!`);
      console.error(`Try changing PORT in your .env file or kill the process using this port.\n`);
    } else {
      logger.error('❌ Server error', { error: error.message, stack: error.stack });
      console.error('\n❌ FATAL SERVER ERROR:', error);
    }
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
} else {
  console.log('ℹ️  17. Skipping server start (module imported, not run directly)');
}

console.log('✅ 20. index.ts execution complete');

export default app;