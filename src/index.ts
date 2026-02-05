import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config, getApiBasePath, isDevelopment } from './config/config';
import { securityHeaders, customSecurityHeaders } from './middleware/securityHeaders';
import { requestLogger, errorLogger } from './middleware/requestLogger';
import { sanitizeRequest } from './middleware/requestSanitization';
import { tieredRateLimiter } from './middleware/tieredRateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestStartTimeMiddleware, sendSuccess } from './utils/response';
import v1Routes from './routes/v1';
import authRoutes from './routes/auth.routes';
import { logger } from './utils/logger';

console.log('✅ 1. All imports loaded successfully');

const app: Application = express();
console.log('✅ 2. Express app created');

// ============================================
// Security Middleware (Order Matters!)
// ============================================

console.log('🔧 3. Applying middleware...');

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

// 4. Cookie parser (needed for session management)
app.use(cookieParser());

// 5. Request sanitization (SQL injection, XSS, NoSQL injection prevention)
app.use(sanitizeRequest);

// Body parsing middleware (after security checks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('✅ 4. All middleware applied');

// Root health check (backward compatibility)
app.get('/health', (req: Request, res: Response) => {
  sendSuccess(req, res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    apiVersion: config.server.apiVersion
  });
});

console.log('✅ 5. Health check route registered');

// API routes - versioned
console.log('🔧 6. Loading routes...');
const apiBasePath = getApiBasePath();
console.log('✅ 7. API base path:', apiBasePath);

app.use(apiBasePath, v1Routes);
console.log('✅ 8. V1 routes loaded');

app.use(`${apiBasePath}/auth`, authRoutes);
console.log('✅ 9. Auth routes loaded');

// 404 handler
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Error handling middleware (must be last)
app.use(errorHandler);

console.log('✅ 10. All routes and error handlers registered');

// Start server
console.log('🔧 11. Preparing to start server...');

if (isDevelopment() || require.main === module) {
  console.log('✅ 12. Starting server on port', config.server.port);
  
  const server = app.listen(config.server.port, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Y TU API SERVER STARTED SUCCESSFULLY!');
    console.log('='.repeat(50));
    logger.info(`✅ Server running on port ${config.server.port}`);
    logger.info(`📍 Environment: ${config.server.nodeEnv}`);
    logger.info(`🔖 API Version: ${config.server.apiVersion}`);
    logger.info(`🌐 API Base Path: ${apiBasePath}`);
    
    if (isDevelopment()) {
      console.log(`\n📍 Available Endpoints:`);
      console.log(`   Health: http://localhost:${config.server.port}/health`);
      console.log(`   API:    http://localhost:${config.server.port}${apiBasePath}`);
      console.log(`   Docs:   http://localhost:${config.server.port}${apiBasePath}/docs`);
      console.log('='.repeat(50) + '\n');
    }
  }).on('error', (error: any) => {
    console.error('\n❌ SERVER ERROR:', error.message);
    if (error.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${config.server.port} is already in use`);
      console.error(`\n💡 Try: Change PORT in .env or kill the process using port ${config.server.port}\n`);
    } else {
      logger.error('❌ Server error', { error: error.message, stack: error.stack });
    }
    process.exit(1);
  });

  // Graceful shutdown handlers
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received: closing server gracefully');
    server.close(() => logger.info('Server closed'));
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received: closing server gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

export default app;