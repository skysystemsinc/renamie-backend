# Deploy NestJS Application to Vercel
# This script helps prepare and deploy your NestJS application to Vercel

Write-Host "🚀 Preparing NestJS application for Vercel deployment..." -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI is not installed. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Check if user is logged in to Vercel
try {
    vercel whoami | Out-Null
    Write-Host "✅ Logged in to Vercel" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please log in to Vercel:" -ForegroundColor Yellow
    vercel login
}

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Blue
npm run build:vercel

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Blue
vercel --prod

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "📝 Don't forget to:" -ForegroundColor Yellow
Write-Host "   1. Set up environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "   2. Configure your database connection" -ForegroundColor White
Write-Host "   3. Set up Stripe keys if using payments" -ForegroundColor White
Write-Host "   4. Test your API endpoints" -ForegroundColor White
Write-Host ""
Write-Host "📚 See VERCEL_DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
