# Standardized API Response Formatter

## Overview

The API uses a standardized response format for all endpoints, ensuring consistency across the entire API. This formatter includes request tracking, timing information, and standardized error codes.

## Response Formats

### Success Response

```typescript
{
  success: true,
  data: {...},  // Response payload
  metadata: {
    requestId: string,        // Unique request identifier
    timestamp: string,         // ISO 8601 timestamp
    processingTime: number    // Processing time in milliseconds
  }
}
```

**Example:**
```json
{
  "success": true,
  "data": {
    "translatedText": "Hello, world!",
    "sourceLanguage": "en",
    "targetLanguage": "es"
  },
  "metadata": {
    "requestId": "req_1703123456789_a1b2c3d4",
    "timestamp": "2023-12-21T10:30:45.123Z",
    "processingTime": 234
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    code: string,        // Error code (see ErrorCode enum)
    message: string,     // Human-readable error message
    details?: {...}      // Additional error details (optional)
  },
  metadata: {
    requestId: string,
    timestamp: string,
    processingTime: number,
    path?: string,       // Request path
    method?: string      // HTTP method
  }
}
```

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "text",
        "message": "Text is required",
        "value": null
      }
    ]
  },
  "metadata": {
    "requestId": "req_1703123456789_a1b2c3d4",
    "timestamp": "2023-12-21T10:30:45.123Z",
    "processingTime": 12,
    "path": "/api/v1/translate",
    "method": "POST"
  }
}
```

## HTTP Status Codes

The formatter uses standard HTTP status codes:

- **200 OK**: Successful GET, PUT, PATCH requests
- **201 Created**: Successful POST requests (resource created)
- **400 Bad Request**: Validation errors, invalid input
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Access denied (authorization failed)
- **404 Not Found**: Resource or endpoint not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side errors
- **503 Service Unavailable**: Service temporarily unavailable

## Error Codes

Standard error codes are defined in `src/utils/errorCodes.ts`:

### Validation Errors (400)
- `VALIDATION_ERROR`: General validation failure
- `INVALID_INPUT`: Invalid input format
- `MISSING_REQUIRED_FIELD`: Required field missing
- `INVALID_FORMAT`: Invalid data format

### Authentication Errors (401)
- `UNAUTHORIZED`: Authentication required
- `INVALID_CREDENTIALS`: Invalid credentials
- `TOKEN_EXPIRED`: Token has expired
- `TOKEN_INVALID`: Invalid token
- `API_KEY_INVALID`: Invalid API key
- `API_KEY_MISSING`: API key not provided

### Authorization Errors (403)
- `FORBIDDEN`: Access forbidden
- `INSUFFICIENT_PERMISSIONS`: Insufficient permissions
- `CSRF_TOKEN_INVALID`: Invalid CSRF token

### Not Found Errors (404)
- `NOT_FOUND`: Resource not found
- `RESOURCE_NOT_FOUND`: Specific resource not found
- `ENDPOINT_NOT_FOUND`: API endpoint not found

### Rate Limiting Errors (429)
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `TOO_MANY_REQUESTS`: Too many requests

### Server Errors (500)
- `INTERNAL_SERVER_ERROR`: Internal server error
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: External service error

### Service Unavailable (503)
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable
- `MAINTENANCE_MODE`: Service in maintenance mode

## Helper Functions

### Success Responses

```typescript
// Send success response (200 OK)
sendSuccess(req, res, data);

// Send created response (201 Created)
sendCreated(req, res, data);
```

### Error Responses

```typescript
// Send bad request error (400)
sendBadRequest(req, res, message, details?);

// Send validation error (400)
sendValidationError(req, res, message, details?);

// Send unauthorized error (401)
sendUnauthorized(req, res, message?, code?);

// Send forbidden error (403)
sendForbidden(req, res, message?, code?);

// Send not found error (404)
sendNotFound(req, res, message?, code?, details?);

// Send rate limit error (429)
sendRateLimitExceeded(req, res, message?, details?);

// Send internal server error (500)
sendInternalServerError(req, res, message?, details?);

// Send service unavailable error (503)
sendServiceUnavailable(req, res, message?, code?);

// Send generic error
sendError(req, res, code, message, statusCode, details?);

// Send error from AppError
sendAppError(req, res, error, details?);
```

## Request ID and Timing

Every request automatically gets:
- **Request ID**: Unique identifier for tracking requests (`req_<timestamp>_<uuid>`)
- **Start Time**: Automatically set when request starts
- **Processing Time**: Calculated automatically in response metadata

The request ID middleware (`requestStartTimeMiddleware`) should be applied early in the middleware chain (before request logging).

## Usage Examples

### In Controllers

```typescript
import { sendSuccess, sendCreated } from '../utils/response';

// Success response
async translate(req: AuthRequest, res: Response, next: NextFunction) {
  const result = await translationService.translate({...});
  sendSuccess(req, res, result);
}

// Created response
async createApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = await createApiKey({...});
  sendCreated(req, res, apiKey);
}
```

### In Error Handlers

```typescript
import { sendAppError } from '../utils/response';

// In error handler middleware
errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  sendAppError(req, res, err, err.details);
}
```

### In Validation Middleware

```typescript
import { sendValidationError } from '../utils/response';

if (!errors.isEmpty()) {
  const errorDetails = formatValidationErrors(errors.array());
  sendValidationError(req, res, 'Validation failed', errorDetails);
}
```

## Migration Guide

To migrate existing code to use the standardized formatter:

1. **Replace direct `res.status().json()` calls:**
   ```typescript
   // Before
   res.status(200).json({ success: true, data: result });
   
   // After
   sendSuccess(req, res, result);
   ```

2. **Use appropriate helper functions:**
   ```typescript
   // Before
   res.status(201).json({ success: true, data: result });
   
   // After
   sendCreated(req, res, result);
   ```

3. **Update error responses:**
   ```typescript
   // Before
   res.status(400).json({ success: false, error: { message: 'Error' } });
   
   // After
   sendBadRequest(req, res, 'Error');
   ```

4. **Add request ID middleware:**
   ```typescript
   import { requestStartTimeMiddleware } from './utils/response';
   
   app.use(requestStartTimeMiddleware); // Early in middleware chain
   ```

## Benefits

1. **Consistency**: All API responses follow the same format
2. **Traceability**: Request IDs enable easy request tracking
3. **Performance Monitoring**: Processing time included in all responses
4. **Error Handling**: Standardized error codes for better client handling
5. **Debugging**: Request metadata helps with troubleshooting
6. **Type Safety**: TypeScript interfaces ensure type safety
