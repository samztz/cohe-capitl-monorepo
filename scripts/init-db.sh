#!/bin/sh
# ============================================
# Database Initialization Script
# Runs Prisma migrations for Docker Compose setup
# ============================================

set -e

echo "🔍 Checking database connection..."

# Wait for database to be ready
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if pg_isready -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        echo "✅ Database is ready"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Database failed to become ready after ${max_attempts} attempts"
        exit 1
    fi
    echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
done

echo "🚀 Running Prisma migrations..."
cd /app/apps/api
pnpm prisma migrate deploy

echo "✅ Database initialization complete!"
