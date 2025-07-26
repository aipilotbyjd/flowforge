#!/bin/bash

# Staging deployment script
set -e

echo "🚀 Starting staging deployment..."

# Run tests
echo "🧪 Running tests..."
nx run-many --target=test --all

# Build for production
echo "🏗️  Building for production..."
nx run-many --target=build --configuration=production --all

# Deploy to staging environment
echo "🚢 Deploying to staging environment..."
# Add your deployment logic here

echo "✅ Staging deployment completed!"
