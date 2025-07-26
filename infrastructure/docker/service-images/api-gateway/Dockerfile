FROM flowforge/node-base:latest

# Set build arguments
ARG NODE_ENV=production
ARG PORT=3000

# Copy built application
COPY dist/apps/api-gateway ./dist
COPY apps/api-gateway/src/assets ./assets

# Copy any additional configuration files
COPY apps/api-gateway/swagger.json ./swagger.json

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV SERVICE_NAME=api-gateway

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE ${PORT}

# Override health check for specific service
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start the API Gateway
CMD ["node", "dist/main.js"]
