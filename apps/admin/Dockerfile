# ============================================
# Admin (Next.js 14 App Router) Dockerfile
# Multi-stage build for production SSR deployment
# ============================================

# Build arguments
ARG NODE_VERSION=20-alpine
ARG APP_PORT=3002

# Next.js build-time environment variables
ARG NEXT_PUBLIC_ADMIN_API_BASE=/api

# ============================================
# Stage 1: Dependencies
# Install all dependencies
# ============================================
FROM node:${NODE_VERSION} AS deps

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy admin app package.json
COPY apps/admin/package.json ./apps/admin/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# Build the Next.js application
# ============================================
FROM node:${NODE_VERSION} AS builder

# Re-declare ARGs in this stage (ARG scope is per-stage)
ARG NEXT_PUBLIC_ADMIN_API_BASE=/api

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin ./apps/admin

# Build the Next.js application
WORKDIR /app/apps/admin

# Set environment variables for build time
ENV NODE_ENV=production
ENV NEXT_PUBLIC_ADMIN_API_BASE=${NEXT_PUBLIC_ADMIN_API_BASE}

# Build the application
RUN pnpm build

# Ensure public directory exists (create empty if not present)
RUN mkdir -p /app/apps/admin/public

# ============================================
# Stage 3: Runner
# Minimal production image for SSR
# ============================================
FROM node:${NODE_VERSION} AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/package.json ./apps/admin/
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/next.config.* ./apps/admin/

# Copy production node_modules
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/apps/admin/node_modules ./apps/admin/node_modules

WORKDIR /app/apps/admin

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE ${APP_PORT}

# Set the port for Next.js to listen on
ENV PORT=${APP_PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${APP_PORT}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js in production mode
# Use next start with dynamic port from ENV
CMD ["sh", "-c", "pnpm next start -p $PORT"]
