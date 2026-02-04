import * as Sentry from '@sentry/node';
import { config } from '../config/config';

// Optional profiling integration (only if package is installed)
let nodeProfilingIntegration: any = null;
try {
  const profiling = require('@sentry/profiling-node');
  nodeProfilingIntegration = profiling.nodeProfilingIntegration;
} catch (e) {
  // Profiling package not installed, skip
}

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export const initSentry = (): void => {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  const integrations: any[] = [];
  if (nodeProfilingIntegration) {
    integrations.push(nodeProfilingIntegration());
  }

  Sentry.init({
    dsn,
    environment: config.server.nodeEnv,
    integrations,
    // Performance Monitoring
    tracesSampleRate: config.server.nodeEnv === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: config.server.nodeEnv === 'production' ? 0.1 : 1.0,
    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
    // Filter out health checks and other noise
    beforeSend(event, hint) {
      // Don't send events for health checks
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    },
    // Ignore certain errors
    ignoreErrors: [
      'ValidationError',
      'UnauthorizedError',
      'RateLimitError',
    ],
  });

  console.log('Sentry initialized for error tracking');
};

/**
 * Capture exception manually
 */
export const captureException = (error: Error, context?: Record<string, any>): void => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture message manually
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info'): void => {
  Sentry.captureMessage(message, level);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb): void => {
  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Set user context
 */
export const setUser = (user: { id?: string; email?: string; username?: string }): void => {
  Sentry.setUser(user);
};

/**
 * Set tag for filtering
 */
export const setTag = (key: string, value: string): void => {
  Sentry.setTag(key, value);
};

/**
 * Set context for additional data
 */
export const setContext = (name: string, context: Record<string, any>): void => {
  Sentry.setContext(name, context);
};
