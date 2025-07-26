#!/bin/bash

# Database migration script
set -e

ENVIRONMENT=${1:-development}
echo "🔄 Running database migrations for $ENVIRONMENT environment..."

# Run TypeORM migrations
npx typeorm migration:run -d src/database/data-source.ts

echo "✅ Database migrations completed!"
