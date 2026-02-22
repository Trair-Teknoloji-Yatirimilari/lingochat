#!/bin/bash

# Deploy UI fixes to production server
# This script pulls latest changes, rebuilds, and restarts the server

echo "🚀 Deploying UI fixes to production..."

cd /var/www/lingochat

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building server..."
pnpm run build

echo "🔄 Restarting PM2 service..."
pm2 restart lingochat-api

echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "📝 Recent logs:"
pm2 logs lingochat-api --lines 20 --nostream
