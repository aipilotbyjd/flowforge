# FlowForge Tools

This directory contains custom NX tools, generators, executors, and utility scripts for the FlowForge project.

## Directory Structure

```
tools/
├── generators/                 # Custom NX generators
│   ├── workflow-node/         # Generator for workflow nodes
│   └── connector/             # Generator for connectors
├── executors/                 # Custom NX executors
│   └── docker-build/          # Custom Docker build executor
├── scripts/                   # Utility scripts
│   ├── deploy/                # Deployment scripts
│   ├── database/              # Database scripts
│   ├── monitoring/            # Monitoring scripts
│   └── development/           # Development helper scripts
└── utils/                     # Utility functions
    ├── file-helpers.ts
    └── string-helpers.ts
```

## Custom Generators

### Workflow Node Generator

Generates a new workflow node with service and module files.

**Usage:**
```bash
nx generate ./tools/generators/workflow-node:workflow-node my-node --category=action --tags=scope:nodes,type:action
```

**Options:**
- `name`: Name of the workflow node (required)
- `category`: Category of the node (trigger, action, transformation, utility, integration)
- `directory`: Directory to generate the node in (default: libs/nodes)
- `tags`: Tags for the project

### Connector Generator

Generates a new connector for external service integrations.

**Usage:**
```bash
nx generate ./tools/generators/connector:connector my-connector --type=http --tags=scope:connectors,type:http
```

**Options:**
- `name`: Name of the connector (required)
- `type`: Type of connector (http, database, cloud, messaging, email)
- `directory`: Directory to generate the connector in (default: libs/connectors)
- `tags`: Tags for the project

## Custom Executors

### Docker Build Executor

Custom executor for building and optionally pushing Docker images.

**Usage:**
Add to your project's `project.json`:

```json
{
  "targets": {
    "docker-build": {
      "executor": "./tools/executors/docker-build:build",
      "options": {
        "dockerfile": "Dockerfile",
        "imageName": "flowforge/my-service",
        "imageTag": "latest"
      }
    }
  }
}
```

Then run:
```bash
nx run my-project:docker-build
```

## Utility Scripts

### Deployment Scripts

- `npm run deploy:dev` - Deploy to development environment
- `npm run deploy:staging` - Deploy to staging environment
- `npm run deploy:prod` - Deploy to production environment

### Database Scripts

- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

### Monitoring Scripts

- `npm run health:check` - Run health checks on all services

### Development Scripts

- `tools/scripts/development/codegen.sh` - Generate code from schemas
- `tools/scripts/development/lint-fix.sh` - Lint and fix all code

## Quick Commands

### Generate a New Workflow Node
```bash
npm run generate:node my-http-node -- --category=action --tags=scope:nodes,type:http
```

### Generate a New Connector
```bash
npm run generate:connector slack-connector -- --type=messaging --tags=scope:connectors,type:messaging
```

### Build Docker Image
```bash
nx run api-gateway:docker-build
```

### Deploy to Development
```bash
npm run deploy:dev
```

## Usage Examples

### Creating a HTTP Request Node

```bash
# Generate the node
npm run generate:node http-request -- --category=action --tags=scope:nodes,type:http

# This creates:
# libs/nodes/http-request/
# ├── src/
# │   ├── lib/
# │   │   ├── http-request.service.ts
# │   │   └── http-request.module.ts
# │   └── index.ts
# └── project.json
```

### Creating a Database Connector

```bash
# Generate the connector
npm run generate:connector postgres-connector -- --type=database --tags=scope:connectors,type:database

# This creates the connector structure with database-specific templates
```

### Building and Deploying

```bash
# Build all projects
nx run-many --target=build --all

# Run tests
nx run-many --target=test --all

# Deploy to development
npm run deploy:dev
```

## Best Practices

1. **Consistent Naming**: Use kebab-case for node and connector names
2. **Proper Tagging**: Always add appropriate tags when generating new components
3. **Directory Organization**: Keep related components in their designated directories
4. **Documentation**: Update this README when adding new tools or scripts
5. **Testing**: Test custom generators and executors before using in production

## Contributing

When adding new tools:

1. Follow the existing directory structure
2. Add proper TypeScript types and schemas
3. Include comprehensive error handling
4. Update this documentation
5. Add examples and usage instructions

## Troubleshooting

### Generator Issues

If generators fail to run:
1. Ensure all dependencies are installed
2. Check that the generator schema is valid JSON
3. Verify the template files use correct EJS syntax

### Executor Issues

If executors fail:
1. Check the schema definition matches the implementation
2. Ensure all required options are provided
3. Verify system dependencies (Docker, etc.) are available

### Script Issues

If scripts fail to execute:
1. Ensure scripts have execute permissions
2. Check that all required tools are installed
3. Verify environment variables are set correctly
