import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Mock external services
jest.mock('../src/services/translationApi.client', () => ({
  translationApiClient: {
    translate: jest.fn(),
    detectLanguage: jest.fn(),
    getSupportedLanguages: jest.fn(),
  },
}));

jest.mock('../src/services/aiToneAnalysis.client', () => ({
  aiToneAnalysisClient: {
    analyzeTone: jest.fn(),
  },
}));

jest.mock('../src/services/aiResponseGeneration.client', () => ({
  aiResponseGenerationClient: {
    generateCandidates: jest.fn(),
  },
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests unless DEBUG is set
  log: process.env.DEBUG ? console.log : jest.fn(),
  debug: process.env.DEBUG ? console.debug : jest.fn(),
  info: process.env.DEBUG ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Cleanup after all tests
afterAll(async () => {
  // Close any open connections, clear timers, etc.
  jest.clearAllTimers();
});
