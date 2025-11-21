# ============================================
# Web (Next.js 14 App Router) Dockerfile
# Multi-stage build for production SSR deployment
# ============================================

# Build arguments
ARG NODE_VERSION=20-alpine
ARG APP_PORT=3000

# Next.js build-time environment variables (NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_API_BASE=/api
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ARG NEXT_PUBLIC_CHAIN_ID=97
ARG NEXT_PUBLIC_CHAIN_NAME="BSC Testnet"
ARG NEXT_PUBLIC_APP_NAME="Cohe Capital"
ARG NEXT_PUBLIC_APP_DESCRIPTION="Web3 Insurance Platform"

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

# Copy web app package.json
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# Build the Next.js application
# ============================================
FROM node:${NODE_VERSION} AS builder

# Re-declare ARGs in this stage (ARG scope is per-stage)
ARG NEXT_PUBLIC_API_BASE=/api
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ARG NEXT_PUBLIC_CHAIN_ID=97
ARG NEXT_PUBLIC_CHAIN_NAME="BSC Testnet"
ARG NEXT_PUBLIC_APP_NAME="Cohe Capital"
ARG NEXT_PUBLIC_APP_DESCRIPTION="Web3 Insurance Platform"

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web ./apps/web

# Build the Next.js application
WORKDIR /app/apps/web

# Set environment variables for build time
# NEXT_PUBLIC_* variables need to be available at build time
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}
ENV NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID}
ENV NEXT_PUBLIC_CHAIN_NAME=${NEXT_PUBLIC_CHAIN_NAME}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_PUBLIC_APP_DESCRIPTION=${NEXT_PUBLIC_APP_DESCRIPTION}

# Build the application
RUN pnpm build

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
# Next.js outputs everything needed to .next folder and uses node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/next.config.* ./apps/web/

# Copy production node_modules
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/apps/web/node_modules ./apps/web/node_modules

WORKDIR /app/apps/web

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE ${APP_PORT}

# Set the port for Next.js to listen on
# This can be overridden by environment variable at runtime
ENV PORT=${APP_PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${APP_PORT}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js in production mode
# Use next start with dynamic port from ENV
CMD ["sh", "-c", "pnpm next start -p $PORT"]
