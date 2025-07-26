#!/bin/bash

# Database seeding script
set -e

ENVIRONMENT=${1:-development}
echo "🌱 Seeding database for $ENVIRONMENT environment..."

# Run seed scripts
# Add your seeding logic here

echo "✅ Database seeding completed!"
