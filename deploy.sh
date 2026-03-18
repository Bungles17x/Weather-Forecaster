#!/bin/bash

# Manual deployment script for GitHub Pages
echo "🚀 Deploying Weather Forecaster to GitHub Pages..."

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to GitHub Pages
echo "📤 Deploying to GitHub Pages..."
npx gh-pages --dist docs --repo https://github.com/Bungles17x/Weather-Forecaster.git

echo "✅ Deployment complete!"
echo "🌐 Live at: https://Bungles17x.github.io/Weather-Forecaster/"
