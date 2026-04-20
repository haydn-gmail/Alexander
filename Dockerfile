FROM node:20-alpine

# su-exec for dropping privileges in entrypoint
RUN apk add --no-cache su-exec

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application code
COPY server/ ./server/
COPY public/ ./public/
COPY entrypoint.sh /entrypoint.sh

# Create data directory
RUN mkdir -p /app/data && chown -R appuser:appgroup /app
RUN chmod +x /entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/auth/users || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server/index.js"]
