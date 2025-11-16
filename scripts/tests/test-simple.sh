#!/bin/bash

# Simple test - just test getting nonce and checking products
set -e

export NO_PROXY=localhost
API_URL="http://localhost:3001"
WALLET="0x83b6e7e65f223336b7531ccab6468017a5eb7f77"

echo "=== Test 1: Health Check ==="
curl -s $API_URL/healthz
echo ""
echo ""

echo "=== Test 2: Get Nonce ==="
NONCE_RESP=$(curl -s -X POST "$API_URL/auth/siwe/nonce" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"$WALLET\"}")
echo "$NONCE_RESP"
echo ""
echo ""

echo "=== Test 3: Get Products ==="
PRODUCTS=$(curl -s "$API_URL/products")
echo "$PRODUCTS" | head -200
echo ""
echo ""

if [ -z "$PRODUCTS" ] || [ "$PRODUCTS" == "[]" ]; then
  echo "❌ No products found in database"
  echo "Running seed script..."
  cd apps/api && node -r tsconfig-paths/register -r ts-node/register prisma/seed.ts
  echo "Seed completed, retrying products..."
  PRODUCTS=$(curl -s "$API_URL/products")
  echo "$PRODUCTS"
fi
