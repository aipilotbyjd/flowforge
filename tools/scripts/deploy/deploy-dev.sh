#!/bin/bash

# Development deployment script
set -e

echo "🚀 Starting development deployment..."

# Build all projects
echo "🏗️  Building projects..."
nx run-many --target=build --all

# Deploy to development environment
echo "🚢 Deploying to development environment..."
# Add your deployment logic here

echo "✅ Development deployment completed!"
