# Validation Middleware Documentation

This directory contains comprehensive input validation middleware using express-validator.

## Files

- `validation.ts` - Main validation middleware with standardized error responses
- `validation.schemas.ts` - Reusable validation schemas for all endpoints
- `validation.utils.ts` - Sanitization utilities to prevent injection attacks

## Features

### 1. ISO 639-1 Language Code Validation
All language codes are validated against the ISO 639-1 standard (2-letter codes like 'en', 'es', 'fr').

### 2. Input Sanitization
All inputs are sanitized to prevent injection attacks:
- Removes null bytes
- Normalizes whitespace
- Removes control characters
- Trims and cleans input

### 3. Standardized Error Responses
All validation errors return a consistent format with HTTP 400 status:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "details": [
      {
        "field": "text",
        "message": "Text is required",
        "value": null
      }
    ]
  }
}
```

## Validation Schemas

### POST /api/v1/translate
- `text`: required, string, max 5000 characters
- `targetLanguage`: required, ISO 639-1 code
- `sourceLanguage`: optional, ISO 639-1 code

### POST /api/v1/analyze-tone
- `text`: required, string, max 5000 characters
- `language`: optional, ISO 639-1 code

### POST /api/v1/generate-response
- `originalText`: required, string, max 5000 characters
- `context`: optional, string, max 10000 characters
- `tone`: optional, one of: professional, casual, friendly, formal, creative
- `language`: optional, ISO 639-1 code

### POST /api/v1/process
- `text`: required, string, max 5000 characters
- `sourceLanguage`: optional, ISO 639-1 code
- `targetLanguage`: optional, ISO 639-1 code
- `context`: optional, string, max 10000 characters
- `options`: optional object with:
  - `analyzeTone`: boolean
  - `translate`: boolean
  - `generateResponse`: boolean

## Reusable Validators

### Text Validation
```typescript
validateText(fieldName: string, maxLength: number = 5000)
validateOptionalText(fieldName: string, maxLength: number = 5000)
```

### Language Code Validation
```typescript
validateLanguageCode(fieldName: string = 'language')
validateRequiredLanguageCode(fieldName: string = 'language')
```

### Other Validators
```typescript
validateTone() // Validates tone field
validateContext() // Validates context field
validateProcessOptions() // Validates process options object
```

## Usage Example

```typescript
import { validate } from './middleware/validation';
import { translateValidationSchema } from './middleware/validation.schemas';

router.post(
  '/translate',
  authenticate,
  validate(translateValidationSchema()),
  controller.translate
);
```

## Security Features

1. **Input Sanitization**: All inputs are sanitized to remove dangerous characters
2. **Type Validation**: Ensures correct data types
3. **Length Limits**: Prevents buffer overflow attacks
4. **Language Code Validation**: Prevents invalid language codes
5. **Standardized Errors**: Prevents information leakage through error messages
