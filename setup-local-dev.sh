#!/bin/bash

# ============================================
# Local Development Setup Script
# Cohe Capital Insurance Platform
# ============================================
#
# This script sets up your local development environment
# for running the platform with Docker Compose
#
# Usage:
#   ./setup-local-dev.sh
#
# ============================================

set -e  # Exit immediately if any command fails
set -u  # Treat unset variables as errors
set -o pipefail  # Prevent errors in pipelines from being masked

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Cohe Capital - Local Dev Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================
# 1. Check Prerequisites
# ============================================
echo -e "${BLUE}[1/5] Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker installed${NC}"

if ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}✗ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose installed${NC}"

# ============================================
# 2. Setup Environment File
# ============================================
echo ""
echo -e "${BLUE}[2/5] Setting up environment file...${NC}"

if [ -f .env ]; then
    echo -e "${YELLOW}⚠ .env file already exists${NC}"
    read -p "Do you want to backup and replace it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}✓ Backed up existing .env${NC}"
        cp .env.local.example .env
        echo -e "${GREEN}✓ Created new .env from template${NC}"
    else
        echo -e "${YELLOW}⚠ Keeping existing .env${NC}"
    fi
else
    cp .env.local.example .env
    echo -e "${GREEN}✓ Created .env from template${NC}"
fi

# ============================================
# 3. Create Required Directories
# ============================================
echo ""
echo -e "${BLUE}[3/5] Creating required directories...${NC}"

mkdir -p docker-volumes/db-data
mkdir -p docker-volumes/uploads/signatures
mkdir -p infra/nginx

echo -e "${GREEN}✓ Created docker-volumes/db-data${NC}"
echo -e "${GREEN}✓ Created docker-volumes/uploads${NC}"

# ============================================
# 4. Check Reown Project ID
# ============================================
echo ""
echo -e "${BLUE}[4/5] Checking Reown Project ID...${NC}"

if grep -q "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here" .env; then
    echo -e "${YELLOW}⚠ WARNING: You're using a placeholder Reown Project ID${NC}"
    echo -e "${YELLOW}  The wallet connection will NOT work without a valid ID${NC}"
    echo ""
    echo -e "  To get a FREE Project ID:"
    echo -e "  1. Visit: ${BLUE}https://cloud.reown.com/${NC}"
    echo -e "  2. Sign up/Login"
    echo -e "  3. Create a new project"
    echo -e "  4. Copy the Project ID"
    echo -e "  5. Update NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env"
    echo ""
    read -p "Do you have a Reown Project ID to configure now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Reown Project ID: " PROJECT_ID
        sed -i "s/NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here/NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$PROJECT_ID/" .env
        echo -e "${GREEN}✓ Updated Reown Project ID${NC}"
    else
        echo -e "${YELLOW}⚠ You can update it later in .env${NC}"
    fi
else
    echo -e "${GREEN}✓ Reown Project ID configured${NC}"
fi

# ============================================
# 5. Display Configuration Summary
# ============================================
echo ""
echo -e "${BLUE}[5/5] Configuration Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Environment:       ${GREEN}Local Development${NC}"
echo -e "Database:          PostgreSQL 16 (Docker)"
echo -e "Database Port:     5432"
echo -e "API Port:          3001"
echo -e "Web Port:          3000"
echo -e "Admin Port:        3002"
echo -e "Nginx Port:        80"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""

# Load environment variables to show actual values
set +e
source .env 2>/dev/null
set -e

# ============================================
# Next Steps
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Next Steps:${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "1. ${YELLOW}Build Docker images:${NC}"
echo -e "   docker compose build"
echo ""
echo -e "2. ${YELLOW}Start all services:${NC}"
echo -e "   docker compose up -d"
echo -e "   ${BLUE}(auto-loads docker-compose.override.yml for local dev)${NC}"
echo ""
echo -e "3. ${YELLOW}Run database migrations:${NC}"
echo -e "   docker compose exec api sh -c \"cd /app/apps/api && pnpm prisma migrate deploy\""
echo ""
echo -e "4. ${YELLOW}Access the application:${NC}"
echo -e "   Web:      http://localhost:3000  (or http://localhost/ via Nginx)"
echo -e "   Admin:    http://localhost:3002"
echo -e "   API:      http://localhost:3001/api"
echo -e "   API Docs: http://localhost:3001/api-docs"
echo -e "   Database: localhost:5432 (for Prisma Studio, pgAdmin)"
echo ""
echo -e "5. ${YELLOW}View logs:${NC}"
echo -e "   docker compose logs -f"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo -e "${BLUE}========================================${NC}"
