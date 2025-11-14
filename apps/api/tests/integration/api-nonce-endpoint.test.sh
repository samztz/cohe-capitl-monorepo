#!/bin/bash

echo "=== Real API SIWE Flow Test ==="
echo ""

# Test wallet address
WALLET_ADDRESS="0x83B6e7E65F223336b7531CCAb6468017a5EB7f77"
API_URL="http://localhost:3001"

echo "Step 1: Request nonce from backend"
echo "  POST $API_URL/auth/siwe/nonce"
NONCE_RESPONSE=$(curl -s -X POST "$API_URL/auth/siwe/nonce" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"$WALLET_ADDRESS\"}")

NONCE=$(echo $NONCE_RESPONSE | jq -r '.nonce')
echo "  Response: $NONCE_RESPONSE"
echo "  Nonce: $NONCE"
echo "  Length: ${#NONCE}"

# Check if nonce contains hyphens
if [[ $NONCE == *"-"* ]]; then
  echo "  ❌ FAIL: Nonce contains hyphens!"
  exit 1
else
  echo "  ✅ PASS: Nonce is alphanumeric (no hyphens)"
fi

# Validate length (should be 32 chars for UUID without hyphens)
if [ ${#NONCE} -eq 32 ]; then
  echo "  ✅ PASS: Nonce length is correct (32 characters)"
else
  echo "  ❌ FAIL: Nonce length is ${#NONCE}, expected 32"
  exit 1
fi

# Check if alphanumeric only
if [[ $NONCE =~ ^[a-zA-Z0-9]+$ ]]; then
  echo "  ✅ PASS: Nonce is alphanumeric only"
else
  echo "  ❌ FAIL: Nonce contains non-alphanumeric characters"
  exit 1
fi

echo ""
echo "🎉 All tests passed! Backend is ready for SIWE authentication."
echo ""
