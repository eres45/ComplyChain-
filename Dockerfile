# ComplyChain - Complete Deployment Container
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY coral-agents/package*.json ./coral-agents/

# Install dependencies
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install
RUN cd coral-agents && npm install

# Copy application code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Create logs directory
RUN mkdir -p backend/logs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend && node server.js &' >> /app/start.sh && \
    echo 'cd /app/frontend && npm start &' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]
