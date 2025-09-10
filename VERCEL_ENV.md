# Vercel Environment Variables Setup

This document outlines the environment variables that need to be configured in Vercel for your NestJS application to work properly.

## Required Environment Variables

### Application Configuration
- `NODE_ENV` - Set to `production` for Vercel deployment
- `PORT` - Vercel will automatically set this, but you can override if needed

### Database Configuration
- `MONGO_URI` - Your MongoDB connection string
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/renamie-backend?retryWrites=true&w=majority`
  - For production, use MongoDB Atlas or another cloud MongoDB service

### JWT Authentication
- `JWT_SECRET` - Secret key for JWT token signing (use a strong, random string)
- `JWT_EXPIRES_IN` - JWT token expiration time (e.g., `15m`, `1h`, `7d`)
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens (different from JWT_SECRET)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration time (e.g., `7d`, `30d`)

### Stripe Payment Integration
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_`)
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with `pk_`)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret (starts with `whsec_`)

### Email Configuration (Optional)
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (usually 587 or 465)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `EMAIL_FROM` - Email address to send from

### Logging
- `LOG_LEVEL` - Logging level (`error`, `warn`, `info`, `debug`)

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the appropriate value
5. Make sure to set the environment to "Production" (and optionally "Preview" for testing)

## Security Notes

- Never commit sensitive environment variables to your repository
- Use strong, unique secrets for JWT tokens
- Use environment-specific database connections
- Consider using Vercel's built-in secret management for sensitive data

## Example Production Values

```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/renamie-prod
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
LOG_LEVEL=info
```

## Testing Environment Variables

You can test your environment variables locally by creating a `.env.local` file with the same variables, or by using Vercel CLI:

```bash
vercel env pull .env.local
```
