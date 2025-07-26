#!/bin/bash

# Health check script
set -e

SERVICES=("api-gateway" "workflow-engine" "node-executor")

echo "🏥 Running health checks..."

for service in "${SERVICES[@]}"; do
    echo "Checking $service..."
    # Add health check logic for each service
    curl -f http://localhost:3000/health || echo "$service is unhealthy"
done

echo "✅ Health checks completed!"
