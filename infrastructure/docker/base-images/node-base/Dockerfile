FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    wget \
    git \
    python3 \
    make \
    g++ \
    ca-certificates \
    tzdata

# Set timezone
ENV TZ=UTC

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S flowforge -u 1001 -G nodejs

# Create necessary directories and set permissions
RUN mkdir -p /app/logs /app/data && \
    chown -R flowforge:nodejs /app

# Switch to non-root user
USER flowforge

# Expose default port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Default command
CMD ["node", "dist/main.js"]
