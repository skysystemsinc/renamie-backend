# Vercel Deployment Guide for Renamie Backend

## Quick Start

Your NestJS application is now configured for Vercel deployment with multiple fallback options.

## Build Configuration

The application uses a two-step build process:
1. `npm run build` - Compiles TypeScript to JavaScript
2. `npm run copy:api` - Copies API handlers to the dist folder

## API Handlers

Two API handlers are available:
- `api/index.js` - Main handler
- `api/[...path].js` - Catch-all handler (recommended)

## Deployment Steps

### 1. Push to Git
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### 2. Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect the configuration

### 3. Environment Variables
Add these in Vercel project settings:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/renamie-backend

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Logging
LOG_LEVEL=info
```

### 4. Deploy
Vercel will automatically build and deploy when you push to your repository.

## Troubleshooting

### Build Failures
If the build fails on Vercel:

1. **Check Build Logs**: Go to your Vercel dashboard → Functions tab → View logs
2. **Verify Environment Variables**: Ensure all required variables are set
3. **Check Dependencies**: Make sure all dependencies are in `package.json`

### Common Issues

1. **Module Not Found**: The API handlers use dynamic imports to avoid TypeScript compilation issues
2. **Timeout Issues**: Function timeout is set to 30 seconds
3. **Memory Issues**: Vercel provides 1024MB by default

### Testing Locally
```bash
# Test the build process
npm run vercel-build

# Check if files are created correctly
ls dist/api
```

## API Endpoints

Once deployed, your API will be available at:
- Base URL: `https://your-app.vercel.app/api/v1`
- Health Check: `https://your-app.vercel.app/api/v1/health`
- Swagger Docs: `https://your-app.vercel.app/api`

## Monitoring

- **Vercel Dashboard**: Monitor function executions and logs
- **Function Logs**: Available in the Functions tab
- **Analytics**: Available in the Analytics tab

## Support

For issues:
- Check Vercel function logs first
- Verify environment variables are set correctly
- Ensure MongoDB connection string is valid
- Check Stripe webhook configuration
