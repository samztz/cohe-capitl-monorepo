#!/bin/bash

# ============================================
# Database Reset Script
# Drops and recreates the database, then runs migrations and seeds
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Database Reset & Seed Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Load environment variables (only the ones we need, safely)
if [ ! -f .env ]; then
  echo -e "${RED}❌ Error: .env file not found${NC}"
  exit 1
fi

# Export only required database variables (safe loading)
export $(grep -E '^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)=' .env | xargs)

# Check if required variables are set
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
  echo -e "${RED}❌ Error: Missing required environment variables${NC}"
  echo "Required: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB"
  exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will DELETE ALL DATA in the database!${NC}"
echo -e "Database: ${GREEN}${POSTGRES_DB}${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
  echo -e "${BLUE}ℹ️  Operation cancelled${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}Step 1: Checking if database container is running...${NC}"

if ! docker compose ps db | grep -q "running"; then
  echo -e "${YELLOW}⚠️  Database container is not running. Starting it...${NC}"
  docker compose up -d db
  echo "Waiting for database to be ready..."
  sleep 5
fi

# Wait for database to be healthy
echo "Waiting for database health check..."
until docker compose exec db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; do
  echo -n "."
  sleep 1
done
echo -e "${GREEN}✓ Database is ready${NC}"
echo ""

echo -e "${BLUE}Step 2: Dropping and recreating database...${NC}"

# Drop all connections to the database
docker compose exec -T db psql -U "$POSTGRES_USER" -d postgres <<-EOSQL
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();
EOSQL

# Drop and recreate database
docker compose exec -T db psql -U "$POSTGRES_USER" -d postgres <<-EOSQL
  DROP DATABASE IF EXISTS "${POSTGRES_DB}";
  CREATE DATABASE "${POSTGRES_DB}";
EOSQL

echo -e "${GREEN}✓ Database dropped and recreated${NC}"
echo ""

echo -e "${BLUE}Step 3: Running Prisma migrations...${NC}"

# Stop API container if running (to avoid connection issues)
docker compose stop api > /dev/null 2>&1 || true

# Run migrations using db-init container
docker compose up --force-recreate db-init

echo -e "${GREEN}✓ Migrations and seed completed${NC}"
echo ""

echo -e "${BLUE}Step 4: Restarting API container...${NC}"
docker compose up -d api

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Database reset completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Database is now ready with fresh data."
echo ""
echo "You can check the data with:"
echo "  docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB -c '\\dt'"
echo ""
