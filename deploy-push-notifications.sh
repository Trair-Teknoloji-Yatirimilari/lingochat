#!/bin/bash

# Deploy push notification fixes to production server
echo "🚀 Deploying push notification fixes to production..."

# SSH into server and run deployment commands
ssh root@91.98.164.2 << 'ENDSSH'
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
echo "📝 Recent logs (last 30 lines):"
pm2 logs lingochat-api --lines 30 --nostream

ENDSSH

echo ""
echo "✅ Push notification deployment complete!"
echo "🧪 Test by sending a message from Simulator to TestFlight user"
