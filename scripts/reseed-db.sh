#!/bin/bash

# ============================================
# Database Reseed Script
# Reruns seed data without dropping the database
# Uses upsert, so safe to run multiple times
# ============================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Database Reseed Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}Step 1: Checking if database container is running...${NC}"

if ! docker compose ps db | grep -q "running"; then
  echo "⚠️  Database container is not running. Starting it..."
  docker compose up -d db
  echo "Waiting for database to be ready..."
  sleep 5
fi

echo -e "${GREEN}✓ Database is ready${NC}"
echo ""

echo -e "${BLUE}Step 2: Running seed script...${NC}"
echo ""

# Run seed using the API container
docker compose exec api sh -c "cd /app/apps/api && node prisma/seed.js"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Database reseed completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
