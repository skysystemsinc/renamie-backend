#!/bin/bash

# Deploy NestJS Application to Vercel
# This script helps prepare and deploy your NestJS application to Vercel

echo "🚀 Preparing NestJS application for Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

# Build the application
echo "🔨 Building application..."
npm run build:vercel

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set up environment variables in Vercel dashboard"
echo "   2. Configure your database connection"
echo "   3. Set up Stripe keys if using payments"
echo "   4. Test your API endpoints"
echo ""
echo "📚 See VERCEL_DEPLOYMENT.md for detailed instructions"
