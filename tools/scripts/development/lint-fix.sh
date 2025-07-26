#!/bin/bash

# Lint and fix script
set -e

echo "🔍 Running linting and auto-fixing..."

# Lint and fix all projects
nx run-many --target=lint --fix --all

# Format with Prettier
echo "✨ Formatting with Prettier..."
npx prettier --write .

echo "✅ Linting and formatting completed!"
