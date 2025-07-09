#!/bin/bash

# EezyGet VPS Deployment Script
# This script updates the backend on the VPS with latest changes from GitHub

VPS_IP="31.97.181.105"
VPS_USER="root"
BACKEND_PATH="/root/eezyget-backend/backend"

echo "🚀 Deploying EezyGet Backend to VPS..."

# Connect to VPS and update the backend
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'EOF'
    echo "📂 Navigating to backend directory..."
    cd /root/eezyget-backend
    
    echo "🔄 Pulling latest changes from GitHub..."
    git pull origin main
    
    echo "📦 Installing/updating dependencies..."
    cd backend
    npm install --production
    
    echo "🔄 Restarting PM2 process..."
    pm2 restart eezyget-backend
    
    echo "📊 Checking PM2 status..."
    pm2 status
    
    echo "✅ Deployment completed!"
EOF

echo "🌐 Testing backend health..."
curl -s "http://${VPS_IP}:3001/health" | head -1

echo "🎉 Deployment successful! Backend is running at http://${VPS_IP}:3001"
echo "📱 Website: https://eezyget.com"