// Initialize Sentry before importing app (if DSN is provided)
if (process.env.SENTRY_DSN) {
  try {
    const { initSentry } = require('../src/utils/sentry');
    initSentry();
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error);
  }
}

import app from '../src/index';

// Vercel serverless function handler
// This exports the Express app as a serverless function
export default app;
