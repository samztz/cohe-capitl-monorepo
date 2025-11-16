#!/bin/bash

# Complete end-to-end test for policy creation
# This script simulates the user flow: SIWE auth -> create policy (multiple times for same SKU)

set -e

API_URL="http://localhost:3001"
WALLET_ADDRESS="0x83b6e7e65f223336b7531ccab6468017a5eb7f77"

echo "========================================="
echo "Policy Creation E2E Test"
echo "========================================="
echo ""

# Step 1: Get nonce
echo "Step 1: Getting nonce for wallet $WALLET_ADDRESS..."
NONCE_RESPONSE=$(curl -s -X POST "$API_URL/auth/siwe/nonce" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"$WALLET_ADDRESS\"}")

echo "Nonce response: $NONCE_RESPONSE"
NONCE=$(echo $NONCE_RESPONSE | grep -o '"nonce":"[^"]*"' | cut -d'"' -f4)
echo "Nonce: $NONCE"
echo ""

# Step 2: Get SKU list
echo "Step 2: Getting available SKUs..."
SKU_RESPONSE=$(curl -s -X GET "$API_URL/products")
echo "SKU response (first 500 chars): ${SKU_RESPONSE:0:500}..."

# Extract first SKU ID
SKU_ID=$(echo $SKU_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Using SKU ID: $SKU_ID"
echo ""

# For testing, we'll skip actual wallet signing and use a mock token
# In production, you would sign with wallet here
echo "Step 3: For this test, we need a valid JWT token"
echo "Please provide a JWT token from your browser localStorage (auth_jwt_token):"
read JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
  echo "Error: No JWT token provided"
  echo "Please log in via the web interface first and get the token from localStorage"
  exit 1
fi

echo ""

# Step 4: Create first policy
echo "Step 4: Creating FIRST policy for wallet $WALLET_ADDRESS and SKU $SKU_ID..."
POLICY1_RESPONSE=$(curl -s -X POST "$API_URL/policy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{\"skuId\":\"$SKU_ID\",\"walletAddress\":\"$WALLET_ADDRESS\"}")

echo "First policy response: $POLICY1_RESPONSE"

if echo "$POLICY1_RESPONSE" | grep -q "error"; then
  echo "❌ FAILED: First policy creation failed"
  echo "Error details: $POLICY1_RESPONSE"
  exit 1
fi

POLICY1_ID=$(echo $POLICY1_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ SUCCESS: First policy created with ID: $POLICY1_ID"
echo ""

# Step 5: Create second policy with SAME wallet and SAME SKU
echo "Step 5: Creating SECOND policy for SAME wallet $WALLET_ADDRESS and SAME SKU $SKU_ID..."
echo "This should succeed (testing repeat purchase)..."

sleep 1

POLICY2_RESPONSE=$(curl -s -X POST "$API_URL/policy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{\"skuId\":\"$SKU_ID\",\"walletAddress\":\"$WALLET_ADDRESS\"}")

echo "Second policy response: $POLICY2_RESPONSE"

if echo "$POLICY2_RESPONSE" | grep -q "error\|already exists\|Unique constraint"; then
  echo "❌ FAILED: Second policy creation failed with unique constraint error"
  echo "Error details: $POLICY2_RESPONSE"
  echo ""
  echo "The unique constraint is STILL present in the database!"
  exit 1
fi

POLICY2_ID=$(echo $POLICY2_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ SUCCESS: Second policy created with ID: $POLICY2_ID"
echo ""

# Step 6: Verify both policies exist
echo "Step 6: Verifying both policies..."
echo "Policy 1 ID: $POLICY1_ID"
echo "Policy 2 ID: $POLICY2_ID"

if [ "$POLICY1_ID" == "$POLICY2_ID" ]; then
  echo "❌ FAILED: Both policies have the same ID!"
  exit 1
fi

echo ""
echo "========================================="
echo "✅ ALL TESTS PASSED!"
echo "========================================="
echo "Successfully created 2 policies for same wallet + SKU"
echo "Repeat purchases are now working correctly!"
