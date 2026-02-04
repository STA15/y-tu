# Y TU API - Postman Collection

Comprehensive Postman collection for testing the Y TU API.

## Files

- **Y_TU_API.postman_collection.json** - Main Postman collection with all API endpoints
- **Y_TU_API.postman_environment.json** - Environment variables template

## Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `Y_TU_API.postman_collection.json`
4. Click **Import**

### 2. Import Environment

1. Click **Import** button
2. Select `Y_TU_API.postman_environment.json`
3. Click **Import**
4. Select the environment from the dropdown (top right)

### 3. Configure Environment Variables

1. Click the **Environments** icon (left sidebar)
2. Select **Y TU API - Development**
3. Set the following variables:
   - `api_url`: Your API base URL (e.g., `http://localhost:3000` or `https://api.yutu.com`)
   - `api_key`: Your API key (get from API Keys section)

### 4. Start Testing

1. Select the environment from the dropdown
2. Navigate through the collection folders
3. Click **Send** on any request

## Collection Structure

### Authentication
- Health Check (no auth required)
- Get API Key Tiers (no auth required)

### Translation
- Translate Text (multiple language examples)
  - English to Spanish
  - English to French (E-commerce)
  - English to German
  - English to Chinese
  - English to Japanese
- Detect Language
- Get Supported Languages

### Tone Analysis
- Analyze Tone - Customer Complaint
- Analyze Tone - Customer Question
- Analyze Tone - Positive Feedback
- Analyze Tone - Spanish Text

### Response Generation
- Generate Response - Empathetic (Customer Service)
- Generate Response - Professional (Business Email)
- Generate Response - Friendly (Customer Support)
- Generate Response - Multilingual (Spanish)

### Full Processing Pipeline
- Process - Full Pipeline (Translate + Analyze + Generate)
- Process - Translation Only
- Process - Tone Analysis Only

### API Key Management
- List API Keys
- Create API Key - FREE Tier
- Create API Key - PRO Tier
- Get API Key Usage

### Metrics
- Get Usage Metrics

## Features

### Pre-request Scripts
- Automatic API key injection
- Request logging
- Environment validation

### Tests
- Response status validation
- Response structure validation
- Rate limit monitoring
- Response time checks

### Examples
Each endpoint includes multiple examples:
- **Languages**: English, Spanish, French, German, Chinese, Japanese
- **Business Contexts**: Customer service, E-commerce, SaaS, Product reviews
- **Tone Scenarios**: Complaints, questions, positive feedback
- **Pricing Tiers**: FREE, STARTER, PRO, ENTERPRISE

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `api_url` | API base URL | `http://localhost:3000` |
| `api_key` | Your API key | `ytu_prod_abc123...` |

### Setting Variables

You can set variables in multiple ways:

1. **Environment File**: Edit the environment JSON file
2. **Postman UI**: Click on environment → Edit → Set values
3. **Pre-request Script**: Set programmatically
   ```javascript
   pm.environment.set("api_key", "your-key-here");
   ```

## Rate Limiting

The collection includes automatic rate limit monitoring:

- Checks `X-RateLimit-Remaining` header
- Warns when rate limit is low (< 10 requests)
- Logs rate limit information in console

### Rate Limits by Tier

- **FREE**: 100 requests/day
- **STARTER**: 1,000 requests/day
- **PRO**: 10,000 requests/day
- **ENTERPRISE**: Unlimited

## Testing Tips

### 1. Start with Health Check
Always start by testing the health check endpoint to verify API connectivity.

### 2. Test Authentication
Use the "Get API Key Tiers" endpoint to verify your API key is working.

### 3. Test Rate Limits
Monitor the rate limit headers in the response to track your usage.

### 4. Use Examples
Each request includes realistic examples. Modify them to test your specific use cases.

### 5. Check Tests
Review the test results in the **Test Results** tab to ensure responses are valid.

## Customization

### Adding New Requests

1. Right-click on a folder
2. Select **Add Request**
3. Configure the request:
   - Method and URL
   - Headers (use `{{api_key}}` variable)
   - Body (if needed)
   - Tests (optional)

### Modifying Pre-request Scripts

1. Select a request
2. Go to **Pre-request Script** tab
3. Add or modify scripts
4. Use `pm.environment.get('variable_name')` to access variables

### Adding Tests

1. Select a request
2. Go to **Tests** tab
3. Write test scripts using Chai assertions:
   ```javascript
   pm.test("Status code is 200", function () {
       pm.response.to.have.status(200);
   });
   ```

## Troubleshooting

### API Key Not Working
- Verify the API key is set in the environment
- Check that the environment is selected
- Ensure the API key format is correct (starts with `ytu_`)

### Requests Failing
- Check the API URL is correct
- Verify the server is running
- Check network connectivity
- Review error messages in the response

### Rate Limit Errors
- Check your tier limits
- Wait for the rate limit window to reset
- Upgrade to a higher tier if needed

## Exporting Collection

To share the collection:

1. Click on the collection (three dots)
2. Select **Export**
3. Choose **Collection v2.1**
4. Save the file

## Additional Resources

- [Postman Documentation](https://learning.postman.com/docs/)
- [Y TU API Documentation](http://localhost:3000/api/v1/docs)
- [OpenAPI Specification](http://localhost:3000/api/v1/openapi.json)

## Support

For issues or questions:
- Check the API documentation at `/api/v1/docs`
- Review the test results for error details
- Contact support: support@ytu-api.com
