# Testing Guide

This directory contains comprehensive tests for the Y TU API using Jest and Supertest.

## Test Structure

```
tests/
├── setup.ts                 # Test environment setup
├── helpers/
│   ├── testHelpers.ts      # Test utility functions
│   └── mocks.ts            # Mock implementations
├── routes/                  # Route handler tests
│   ├── health.test.ts
│   └── translate.test.ts
├── middleware/              # Middleware tests
│   ├── validation.test.ts
│   └── apiKeyAuth.test.ts
├── services/                # Service tests
│   └── translation.test.ts
└── utils/                   # Utility function tests
    ├── response.test.ts
    └── apiKey.test.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in CI mode
```bash
npm run test:ci
```

## Test Configuration

### Environment Variables

Create a `.env.test` file (see `.env.test.example`) with test-specific configuration:

```env
NODE_ENV=test
PORT=3001
JWT_SECRET=test-jwt-secret
OPENAI_API_KEY=test-key
```

### Jest Configuration

Jest is configured in `jest.config.js`:
- Uses `ts-jest` for TypeScript support
- Test files: `**/*.test.ts` or `**/*.spec.ts`
- Coverage reports: text, lcov, html
- Setup file: `tests/setup.ts`

## Writing Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Testing Routes

```typescript
import request from 'supertest';
import express from 'express';
import myRoutes from '../../src/routes/v1/my.routes';

describe('My Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/my', myRoutes);
  });

  it('should handle GET request', async () => {
    const response = await request(app)
      .get('/api/v1/my')
      .set('X-API-Key', 'test-key');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Testing Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import myMiddleware from '../../src/middleware/my.middleware';
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/testHelpers';

describe('My Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  it('should call next() on success', () => {
    myMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });
});
```

### Testing Services

```typescript
import { myService } from '../../src/services/my.service';

// Mock dependencies
jest.mock('../../src/services/dependency.service', () => ({
  dependencyService: {
    method: jest.fn(),
  },
}));

describe('My Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform operation', async () => {
    const result = await myService.operation();
    expect(result).toBeDefined();
  });
});
```

## Test Helpers

### createMockRequest
Creates a mock Express request object.

### createMockResponse
Creates a mock Express response object with jest mocks.

### createMockNext
Creates a mock NextFunction.

### createTestApiKey
Creates a test API key object.

### Mock Responses
Pre-defined mock responses for external services:
- `mockTranslationResponse`
- `mockToneAnalysisResponse`
- `mockResponseGenerationResponse`

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Mock External Services**: Don't make real API calls in tests
3. **Test Edge Cases**: Include error scenarios and boundary conditions
4. **Use Descriptive Names**: Test names should clearly describe what they test
5. **Arrange-Act-Assert**: Structure tests with clear sections
6. **Clean Up**: Reset mocks and state in `beforeEach`/`afterEach`
7. **Test Security**: Include tests for authentication, authorization, and validation

## Continuous Integration

Tests run automatically in CI/CD pipelines:
- All tests must pass
- Coverage thresholds must be met
- No linting errors

## Debugging Tests

### Run specific test file
```bash
npm test -- tests/routes/health.test.ts
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should translate"
```

### Debug mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Common Issues

### Module not found
- Ensure all dependencies are installed
- Check import paths are correct
- Verify `tsconfig.json` paths

### Mock not working
- Clear mocks in `beforeEach`
- Check mock implementation matches actual interface
- Verify jest.mock() is called before imports

### Timeout errors
- Increase `testTimeout` in `jest.config.js`
- Check for hanging promises
- Verify async/await is used correctly
