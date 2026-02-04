# Vercel Deployment Guide

Complete guide for deploying the Y TU API to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Code should be in a Git repository (GitHub, GitLab, or Bitbucket)
3. **Node.js**: Version 18.x or higher

## Quick Start

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Deploy from CLI

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 3. Deploy from Git (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your Git repository
4. Configure project settings
5. Deploy!

## Configuration

### Environment Variables

Set the following environment variables in Vercel Dashboard:

**Required:**
- `NODE_ENV=production`
- `JWT_SECRET` - Your JWT secret key
- `OPENAI_API_KEY` - OpenAI API key
- `TRANSLATION_SERVICE_API_KEY` - Translation service API key

**Optional:**
- `SENTRY_DSN` - Sentry DSN for error tracking
- `BASE_URL` - Your Vercel deployment URL
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)

See `vercel.env.example` for complete list.

### Setting Environment Variables

1. Go to **Project Settings** → **Environment Variables**
2. Add each variable for:
   - **Production**
   - **Preview** (optional)
   - **Development** (optional)
3. Click **Save**

### Custom Domain

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

## Project Structure

```
.
├── api/
│   └── index.ts          # Vercel serverless function entry point
├── src/
│   └── index.ts          # Express app
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Build Configuration

### Build Command

Vercel automatically runs:
```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Start Command

For serverless functions, Vercel uses the exported handler from `api/index.ts`.

### Output Directory

Compiled files are in `dist/` directory.

## Routing

### API Routes

All API routes are accessible at:
- `/api/v1/*` - Versioned API endpoints
- `/health` - Health check (redirects to `/api/v1/health`)
- `/api/docs` - API documentation (redirects to `/api/v1/docs`)

### Route Rewrites

Configured in `vercel.json`:
- `/health` → `/api/v1/health`
- `/api/docs` → `/api/v1/docs`
- `/api/openapi.json` → `/api/v1/openapi.json`

## Monitoring

### Health Check

Monitor your API health:
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
    "apiVersion": "v1",
    "uptime": 3600.5,
    "service": "ytu-api"
  },
  "metadata": {
    "requestId": "req_...",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "processingTime": 5
  }
}
```

### Error Tracking (Sentry)

1. **Create Sentry Project**:
   - Go to [sentry.io](https://sentry.io)
   - Create a new project (Node.js)
   - Copy the DSN

2. **Configure Sentry**:
   - Add `SENTRY_DSN` to Vercel environment variables
   - Errors will automatically be tracked

3. **View Errors**:
   - Go to Sentry dashboard
   - View errors, performance, and releases

## Performance

### Function Configuration

Configured in `vercel.json`:
- **Runtime**: Node.js 18.x
- **Memory**: 1024 MB
- **Max Duration**: 30 seconds
- **Region**: `iad1` (US East)

### Optimizations

1. **Caching**: Responses are cached where appropriate
2. **Compression**: Enable gzip compression
3. **CDN**: Vercel automatically uses CDN for static assets

## CI/CD

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Pushes to `main`/`master` branch
- **Preview**: Pull requests and other branches

### Deployment Hooks

Configure webhooks in **Project Settings** → **Git**:
- Pre-deployment hooks
- Post-deployment hooks

## Troubleshooting

### Build Failures

1. **Check Build Logs**:
   - Go to **Deployments** → Select deployment → **Build Logs**

2. **Common Issues**:
   - Missing environment variables
   - TypeScript compilation errors
   - Missing dependencies

### Runtime Errors

1. **Check Function Logs**:
   - Go to **Deployments** → Select deployment → **Function Logs**

2. **Check Sentry**:
   - View error tracking in Sentry dashboard

### Performance Issues

1. **Check Function Duration**:
   - Monitor in Vercel dashboard
   - Optimize slow endpoints

2. **Memory Usage**:
   - Increase memory in `vercel.json` if needed

## Environment-Specific Configuration

### Production

- `NODE_ENV=production`
- Full error tracking
- Performance monitoring
- Rate limiting enabled

### Preview

- `NODE_ENV=production`
- Same as production but for testing

### Development

- `NODE_ENV=development`
- Verbose logging
- Relaxed rate limits

## Security

### Environment Variables

- Never commit secrets to Git
- Use Vercel environment variables
- Rotate keys regularly

### CORS

Configure in environment variables:
```
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Rate Limiting

Configured per tier:
- FREE: 100 requests/day
- STARTER: 1,000 requests/day
- PRO: 10,000 requests/day
- ENTERPRISE: Unlimited

## Rollback

### Manual Rollback

1. Go to **Deployments**
2. Find previous successful deployment
3. Click **⋯** → **Promote to Production**

### Automatic Rollback

Vercel automatically rolls back if:
- Build fails
- Health check fails (if configured)

## Monitoring & Alerts

### Vercel Analytics

Enable in **Project Settings** → **Analytics**:
- Real-time metrics
- Performance insights
- Error tracking

### Custom Monitoring

Set up monitoring for:
- Health check endpoint
- Response times
- Error rates
- Rate limit usage

## Best Practices

1. **Environment Variables**: Use Vercel dashboard, not `.env` files
2. **Secrets**: Rotate regularly
3. **Monitoring**: Set up alerts for errors
4. **Performance**: Monitor function duration
5. **Testing**: Test in preview deployments before production
6. **Documentation**: Keep API docs updated
7. **Backup**: Regular database backups (if applicable)

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **API Documentation**: `/api/v1/docs`
