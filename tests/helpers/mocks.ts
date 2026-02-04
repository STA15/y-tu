/**
 * Mock implementations for external services
 */

export const mockTranslationService = {
  translate: jest.fn(),
  detectLanguage: jest.fn(),
  getSupportedLanguages: jest.fn(),
};

export const mockToneAnalysisService = {
  analyzeTone: jest.fn(),
  generateSuggestions: jest.fn(),
};

export const mockGenerateResponseService = {
  generate: jest.fn(),
};

export const mockApiKeyStore = {
  findByKey: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  recordUsage: jest.fn(),
  getDailyRequestCount: jest.fn(),
  listByUserId: jest.fn(),
};

export const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

/**
 * Reset all mocks
 */
export const resetAllMocks = (): void => {
  mockTranslationService.translate.mockReset();
  mockTranslationService.detectLanguage.mockReset();
  mockTranslationService.getSupportedLanguages.mockReset();
  
  mockToneAnalysisService.analyzeTone.mockReset();
  mockToneAnalysisService.generateSuggestions.mockReset();
  
  mockGenerateResponseService.generate.mockReset();
  
  mockApiKeyStore.findByKey.mockReset();
  mockApiKeyStore.findById.mockReset();
  mockApiKeyStore.create.mockReset();
  mockApiKeyStore.update.mockReset();
  mockApiKeyStore.delete.mockReset();
  mockApiKeyStore.recordUsage.mockReset();
  mockApiKeyStore.getDailyRequestCount.mockReset();
  mockApiKeyStore.listByUserId.mockReset();
  
  mockLogger.info.mockReset();
  mockLogger.warn.mockReset();
  mockLogger.error.mockReset();
  mockLogger.debug.mockReset();
};
