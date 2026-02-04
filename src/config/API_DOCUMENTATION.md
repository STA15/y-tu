# API Documentation Guide

## Overview

The Y TU API uses Swagger/OpenAPI 3.0 for comprehensive API documentation. The documentation is interactive and allows you to test endpoints directly from the browser.

## Accessing Documentation

### Interactive Documentation (Swagger UI)
- **URL**: `http://localhost:3000/api/v1/docs`
- **Production**: `https://your-domain.com/api/v1/docs`

### OpenAPI Specification

The OpenAPI specification is available in multiple formats:

1. **JSON Format**:
   - `/api/v1/docs/json`
   - `/api/v1/openapi.json` (RapidAPI compatible)

2. **YAML Format**:
   - `/api/v1/docs/yaml`
   - `/api/v1/openapi.yaml` (RapidAPI compatible)

## Features

### Interactive Testing
- Test endpoints directly from the browser
- No need for external tools like Postman
- See request/response examples
- Try different authentication methods

### Comprehensive Documentation
- All endpoints documented with:
  - Request parameters and body schemas
  - Response schemas and examples
  - Authentication requirements
  - Rate limiting information
  - Error responses

### Multiple Examples
- Examples for different pricing tiers
- Examples for different languages
- Examples for various use cases:
  - Customer service
  - E-commerce
  - Content localization
  - Multilingual support

## Authentication in Swagger UI

1. Click the **Authorize** button at the top of the page
2. Enter your API key in one of the following formats:
   - **ApiKeyAuth**: Just the API key (e.g., `ytu_prod_abc123...`)
   - **BearerAuth**: The API key as a Bearer token
3. Click **Authorize**
4. Your API key will be included in all requests

## Rate Limiting Information

Rate limits are displayed in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Tier`: Your current tier

### Tier Limits
- **FREE**: 100 requests/day
- **STARTER**: 1,000 requests/day
- **PRO**: 10,000 requests/day
- **ENTERPRISE**: Unlimited

## Using OpenAPI Spec for RapidAPI

To publish your API on RapidAPI:

1. Export the OpenAPI specification:
   ```bash
   curl http://localhost:3000/api/v1/openapi.json > openapi.json
   ```

2. Upload to RapidAPI:
   - Go to RapidAPI Provider Dashboard
   - Create a new API
   - Upload the `openapi.json` file
   - RapidAPI will automatically generate the API documentation

## Documentation Structure

### Tags
Endpoints are organized by tags:
- **Health**: Health check endpoints
- **Translation**: Translation services
- **Tone Analysis**: Tone and sentiment analysis
- **Response Generation**: AI response generation
- **Process**: All-in-one processing
- **Languages**: Language detection and support
- **API Keys**: API key management
- **Metrics**: Usage metrics

### Schemas
All request/response schemas are defined in the `components.schemas` section:
- `TranslationRequest` / `TranslationResponse`
- `ToneAnalysisRequest` / `ToneAnalysisResponse`
- `GenerateResponseRequest` / `GenerateResponseResponse`
- `ProcessRequest` / `ProcessResponse`
- `Error` / `Success`
- `ResponseMetadata`
- `ApiKeyInfo` / `ApiKeyUsage`

### Examples
Each endpoint includes multiple examples:
- Different use cases (customer service, e-commerce, etc.)
- Different languages
- Different tiers
- Success and error scenarios

## Customization

### Updating Documentation

1. **Add new endpoint**: Add Swagger annotations to route files
2. **Update schemas**: Modify `src/config/swagger.config.ts`
3. **Add examples**: Include in route annotations

### Swagger Annotations Format

```typescript
/**
 * @swagger
 * /endpoint:
 *   method:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [TagName]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestSchema'
 *           examples:
 *             example1:
 *               summary: Example 1
 *               value:
 *                 field: "value"
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseSchema'
 */
```

## Best Practices

1. **Keep documentation up to date**: Update when adding/modifying endpoints
2. **Include examples**: Provide realistic examples for each endpoint
3. **Document errors**: Include all possible error responses
4. **Rate limiting**: Always document rate limits for each endpoint
5. **Authentication**: Clearly indicate authentication requirements

## Troubleshooting

### Documentation not loading
- Check that `swagger-ui-express` is installed
- Verify route is mounted correctly
- Check browser console for errors

### OpenAPI spec not generating
- Verify all Swagger annotations are correct
- Check `swagger.config.ts` for correct paths
- Ensure `swagger-jsdoc` is parsing files correctly

### Examples not showing
- Verify example format matches schema
- Check that examples are properly formatted JSON
- Ensure examples are within the requestBody/examples section
