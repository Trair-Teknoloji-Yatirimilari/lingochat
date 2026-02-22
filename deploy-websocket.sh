#!/bin/bash

# WebSocket Real-Time Messaging Deployment Script
# Server: 91.98.164.2

echo "🚀 Starting WebSocket deployment to production..."

# SSH to server and deploy
ssh root@91.98.164.2 << 'ENDSSH'
  echo "📦 Navigating to project directory..."
  cd /root/lingochat || exit 1
  
  echo "🔄 Pulling latest changes from GitHub..."
  git pull origin main
  
  echo "📦 Installing dependencies..."
  npm install
  
  echo "🔨 Building backend..."
  npm run build
  
  echo "🔄 Restarting backend service..."
  pm2 restart lingochat-backend || pm2 start npm --name "lingochat-backend" -- start
  
  echo "✅ Deployment complete!"
  echo "📊 Checking service status..."
  pm2 status
  
  echo "📝 Showing recent logs..."
  pm2 logs lingochat-backend --lines 20 --nostream
ENDSSH

echo "✅ WebSocket deployment completed successfully!"
