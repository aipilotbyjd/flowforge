#!/bin/bash

# FlowForge Enterprise Development Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up FlowForge Enterprise Development Environment"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo -e "${BLUE}📋 Checking requirements...${NC}"
    
    command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js is required but not installed.${NC}" >&2; exit 1; }
    command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is required but not installed.${NC}" >&2; exit 1; }
    command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed.${NC}" >&2; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose is required but not installed.${NC}" >&2; exit 1; }
    
    echo -e "${GREEN}✅ All requirements satisfied${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install --legacy-peer-deps
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Set up environment variables
setup_environment() {
    echo -e "${BLUE}🔧 Setting up environment variables...${NC}"
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please update .env file with your configuration${NC}"
    else
        echo -e "${GREEN}✅ Environment file already exists${NC}"
    fi
}

# Start infrastructure services
start_infrastructure() {
    echo -e "${BLUE}🐳 Starting infrastructure services...${NC}"
    cd infrastructure/docker
    docker-compose -f docker-compose.dev.yml up -d
    cd ../..
    
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 30
    
    echo -e "${GREEN}✅ Infrastructure services started${NC}"
    echo -e "${BLUE}📊 Services available at:${NC}"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo "  - RabbitMQ Management: http://localhost:15672"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3000"
    echo "  - PgAdmin: http://localhost:5050"
    echo "  - Elasticsearch: http://localhost:9200"
    echo "  - Jaeger: http://localhost:16686"
}

# Build libraries
build_libraries() {
    echo -e "${BLUE}🏗️  Building shared libraries...${NC}"
    
    echo "Building core types..."
    npx nx build core-types
    
    echo "Building data access..."
    npx nx build data-access-database
    
    echo "Building workflow engine..."
    npx nx build workflow-engine-executor
    
    echo -e "${GREEN}✅ Libraries built successfully${NC}"
}

# Generate TypeScript paths
generate_paths() {
    echo -e "${BLUE}🛠️  Generating TypeScript paths...${NC}"
    npx nx reset
    echo -e "${GREEN}✅ TypeScript paths updated${NC}"
}

# Run health checks
health_check() {
    echo -e "${BLUE}🏥 Running health checks...${NC}"
    
    # Check if PostgreSQL is ready
    if nc -z localhost 5432; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is not ready${NC}"
    fi
    
    # Check if Redis is ready
    if nc -z localhost 6379; then
        echo -e "${GREEN}✅ Redis is ready${NC}"
    else
        echo -e "${RED}❌ Redis is not ready${NC}"
    fi
}

# Main setup function
main() {
    echo -e "${GREEN}"
    echo "  ███████╗██╗      ██████╗ ██╗    ██╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗"
    echo "  ██╔════╝██║     ██╔═══██╗██║    ██║██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝"
    echo "  █████╗  ██║     ██║   ██║██║ █╗ ██║█████╗  ██║   ██║██████╔╝██║  ███╗█████╗  "
    echo "  ██╔══╝  ██║     ██║   ██║██║███╗██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  "
    echo "  ██║     ███████╗╚██████╔╝╚███╔███╔╝██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗"
    echo "  ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝"
    echo -e "${NC}"
    
    check_requirements
    install_dependencies
    setup_environment
    start_infrastructure
    build_libraries
    generate_paths
    health_check
    
    echo -e "${GREEN}"
    echo "🎉 FlowForge Enterprise Development Environment Setup Complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with proper configuration"
    echo "2. Run 'npm run start:dev' to start the API Gateway"
    echo "3. Visit http://localhost:3000/docs for API documentation"
    echo ""
    echo "Available commands:"
    echo "  npm run start:dev        - Start API Gateway in development mode"
    echo "  npm run start:all        - Start all services"
    echo "  npm run build:all        - Build all applications and libraries"
    echo "  npm run test:all         - Run all tests"
    echo "  npm run lint:all         - Lint all projects"
    echo -e "${NC}"
}

# Run the main function
main "$@"
