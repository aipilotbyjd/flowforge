#!/bin/bash

# Production deployment script
set -e

echo "🚀 Starting production deployment..."

# Run all tests
echo "🧪 Running all tests..."
nx run-many --target=test --all
nx run-many --target=lint --all

# Build for production
echo "🏗️  Building for production..."
nx run-many --target=build --configuration=production --all

# Deploy to production environment
echo "🚢 Deploying to production environment..."
# Add your deployment logic here

echo "✅ Production deployment completed!"
