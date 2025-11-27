# ============================================
# API (NestJS + Prisma) Dockerfile
# Multi-stage build for production deployment
# ============================================

# Build arguments (can be overridden at build time)
ARG NODE_VERSION=20-alpine
ARG APP_PORT=3001

# ============================================
# Stage 1: Dependencies
# Install all dependencies including devDependencies
# ============================================
FROM node:${NODE_VERSION} AS deps

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy API package.json and prisma schema
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma

# Install dependencies for the entire monorepo
# Using --frozen-lockfile ensures exact versions from lock file
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
# Set dummy DATABASE_URL for build-time (actual URL provided at runtime)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN cd apps/api && pnpm prisma generate

# ============================================
# Stage 2: Builder
# Build the application
# ============================================
FROM node:${NODE_VERSION} AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy Prisma Client generated in deps stage
COPY --from=deps /app/apps/api/generated ./apps/api/generated

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api ./apps/api

# Build the application
WORKDIR /app/apps/api
RUN pnpm build

# ============================================
# Stage 3: Runner
# Minimal production image
# ============================================
FROM node:${NODE_VERSION} AS runner

# Install pnpm (needed for production)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Create non-root user for security
# Note: Alpine uses 'addgroup' and 'adduser' instead of 'groupadd'/'useradd'
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nestjs

# Copy only production dependencies
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/generated ./apps/api/generated
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/

# Copy Prisma schema and migrations (needed for prisma migrate deploy)
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma

# Create uploads directory for signature storage
# Must match the path where uploads volume will be mounted
# Note: Volume mount will override these permissions, so we handle it in entrypoint
RUN mkdir -p /app/apps/api/uploads/signatures

# Create symlink for Prisma Client to be accessible from compiled code
# Compiled code in dist/src looks for ../../../generated, which resolves to dist/generated
# We create a symlink from dist/generated to the actual generated directory
RUN ln -s /app/apps/api/generated /app/apps/api/dist/generated

WORKDIR /app/apps/api

# Create entrypoint script to fix permissions before starting app
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'set -e' >> /app/entrypoint.sh && \
    echo '' >> /app/entrypoint.sh && \
    echo '# Fix uploads directory permissions if mounted as volume' >> /app/entrypoint.sh && \
    echo 'if [ -d "/app/apps/api/uploads" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Fixing uploads directory permissions..."' >> /app/entrypoint.sh && \
    echo '  chown -R nestjs:nodejs /app/apps/api/uploads' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo '' >> /app/entrypoint.sh && \
    echo '# Switch to nestjs user and execute command' >> /app/entrypoint.sh && \
    echo 'exec su-exec nestjs:nodejs "$@"' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Install su-exec for user switching in entrypoint
RUN apk add --no-cache su-exec

# Switch to non-root user (note: entrypoint will handle final user switch)
# We keep root here to fix permissions, then su-exec to nestjs
USER root

# Expose port (configurable via environment variable)
# Default port is defined in ARG, actual runtime port set via $PORT env var
EXPOSE ${APP_PORT}

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${APP_PORT}/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set entrypoint to fix permissions
ENTRYPOINT ["/app/entrypoint.sh"]

# Start the application
# Use node to run the compiled dist/src/main.js
# WORKDIR is /app/apps/api, so use relative path
CMD ["node", "dist/src/main.js"]
