# Vercel Setup Guide

Step-by-step guide to deploy the Y TU API to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Your code should be in GitHub, GitLab, or Bitbucket
3. **Node.js 18+**: Required for the API

## Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your Git repository
4. Vercel will auto-detect the project settings

## Step 2: Configure Project Settings

### Build Settings

Vercel will auto-detect:
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `.` (root)

### Function Settings

The API is configured as a serverless function:
- **Runtime**: Node.js 18.x
- **Memory**: 1024 MB
- **Max Duration**: 30 seconds
- **Region**: US East (iad1)

## Step 3: Environment Variables

Add the following environment variables in **Project Settings** → **Environment Variables**:

### Required Variables

```bash
NODE_ENV=production
JWT_SECRET=your-jwt-secret-key
OPENAI_API_KEY=your-openai-api-key
TRANSLATION_SERVICE_API_KEY=your-translation-api-key
```

### Optional Variables

```bash
# API Configuration
API_VERSION=v1
BASE_URL=your-app.vercel.app

# CORS
ALLOWED_ORIGINS=*
CORS_CREDENTIALS=false

# Error Tracking
SENTRY_DSN=your-sentry-dsn-url

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
THROTTLE_WINDOW_MS=1000
THROTTLE_MAX_REQUESTS=50
```

### Setting Environment Variables

1. Go to **Project Settings** → **Environment Variables**
2. For each variable:
   - Enter **Name** and **Value**
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

**Important**: Set variables for all environments (Production, Preview, Development) as needed.

## Step 4: Deploy

### Automatic Deployment

Once connected to Git:
- **Production**: Automatically deploys on push to `main`/`master` branch
- **Preview**: Automatically deploys on pull requests and other branches

### Manual Deployment

Using Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Step 5: Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Follow DNS configuration instructions:
   - Add CNAME record pointing to Vercel
   - Wait for DNS propagation (up to 48 hours)
5. Vercel will automatically provision SSL certificate

## Step 6: Verify Deployment

### Health Check

```bash
curl https://your-app.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "production",
    "apiVersion": "v1"
  }
}
```

### API Documentation

Visit: `https://your-app.vercel.app/api/v1/docs`

### OpenAPI Spec

- JSON: `https://your-app.vercel.app/api/v1/openapi.json`
- YAML: `https://your-app.vercel.app/api/v1/openapi.yaml`

## Step 7: Error Tracking (Sentry)

### Setup Sentry

1. **Create Sentry Account**: Go to [sentry.io](https://sentry.io)
2. **Create Project**:
   - Select **Node.js** platform
   - Copy the **DSN**
3. **Add to Vercel**:
   - Go to **Project Settings** → **Environment Variables**
   - Add `SENTRY_DSN` with your Sentry DSN
   - Deploy again

### View Errors

- Go to Sentry dashboard
- Errors will automatically appear
- Set up alerts for critical errors

## Monitoring

### Vercel Analytics

1. Go to **Project Settings** → **Analytics**
2. Enable **Web Analytics** (if available)
3. View metrics in dashboard

### Function Logs

1. Go to **Deployments**
2. Select a deployment
3. Click **Function Logs**
4. View real-time logs

### Performance

Monitor in Vercel dashboard:
- Function duration
- Memory usage
- Invocation count
- Error rate

## Troubleshooting

### Build Failures

**Issue**: Build fails during deployment

**Solutions**:
1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compiles: `npm run build`
4. Check for missing environment variables

### Runtime Errors

**Issue**: API returns 500 errors

**Solutions**:
1. Check function logs
2. Verify environment variables are set
3. Check Sentry for error details
4. Test locally first: `npm run dev`

### CORS Errors

**Issue**: CORS errors from frontend

**Solutions**:
1. Set `ALLOWED_ORIGINS` environment variable
2. Include your frontend domain
3. Example: `ALLOWED_ORIGINS=https://app.yourdomain.com`

### Rate Limiting

**Issue**: Rate limit errors

**Solutions**:
1. Check your API key tier
2. Monitor usage in metrics endpoint
3. Upgrade tier if needed

## Environment-Specific Configuration

### Production

- `NODE_ENV=production`
- Full error tracking
- Performance monitoring
- Strict rate limiting

### Preview

- Same as production
- Used for testing PRs
- Separate environment variables

### Development

- `NODE_ENV=development`
- Verbose logging
- Relaxed rate limits

## Best Practices

1. **Never commit secrets**: Use Vercel environment variables
2. **Test in preview**: Test PRs before merging
3. **Monitor errors**: Set up Sentry alerts
4. **Track performance**: Monitor function duration
5. **Rotate keys**: Regularly rotate API keys
6. **Use custom domains**: For production APIs
7. **Enable analytics**: Track API usage

## Rollback

### Manual Rollback

1. Go to **Deployments**
2. Find previous successful deployment
3. Click **⋯** → **Promote to Production**

### Automatic Rollback

Vercel automatically rolls back if:
- Build fails
- Health check fails (if configured)

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **API Docs**: `/api/v1/docs`
