#!/bin/bash

# ============================================
# Test Payment Confirmation Script
# Quick test for payment verification
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ] || [ -z "$2" ]; then
  echo -e "${RED}Usage: $0 <policyId> <txHash>${NC}"
  echo ""
  echo "Example:"
  echo "  $0 e1b48453-2eac-4836-ab5d-345326e7b7d7 0xf38aa9a95f709f1e5944d8ee2d862ae7d527a6d7d585e4b3079ef8f416dcb982"
  exit 1
fi

POLICY_ID="$1"
TX_HASH="$2"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Testing Payment Confirmation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Policy ID: $POLICY_ID"
echo "TX Hash:   $TX_HASH"
echo ""

echo -e "${BLUE}Sending payment confirmation request...${NC}"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3001/api/payment/confirm \
  -H "Content-Type: application/json" \
  -d "{
    \"policyId\": \"$POLICY_ID\",
    \"txHash\": \"$TX_HASH\"
  }")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo -e "${BLUE}Checking API logs for details...${NC}"
docker compose logs api --tail=50 | grep -E "verifyTransfer|Transfer event|No Transfer" | tail -20

echo ""
