/**
 * Test script for POST /policy endpoint
 * Uses direct JWT generation to bypass SIWE issues
 */

const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3001';
const TEST_WALLET = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-e2e-testing';

async function main() {
  console.log('🧪 Testing POST /policy endpoint with JWT\n');

  // 1. Ensure user exists in database
  console.log(`Step 1: Ensure user exists for ${TEST_WALLET}`);
  const nonceRes = await fetch(`${API_BASE}/auth/siwe/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: TEST_WALLET }),
  });
  const { nonce } = await nonceRes.json();
  console.log(`✅ User record created/updated (nonce: ${nonce})\n`);

  // 2. Generate JWT token directly (bypass SIWE)
  console.log('Step 2: Generate JWT token');
  const token = jwt.sign(
    { address: TEST_WALLET.toLowerCase() },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  console.log(`✅ JWT token: ${token.substring(0, 30)}...\n`);

  // 3. Get SKU ID
  console.log('Step 3: Get SKU ID');
  const productsRes = await fetch(`${API_BASE}/products`);
  const products = await productsRes.json();
  const skuId = products[0].id;
  console.log(`✅ SKU ID: ${skuId}\n`);

  // 4. Create policy (first attempt - should succeed)
  console.log('Step 4: Create policy (first attempt)');
  const createRes1 = await fetch(`${API_BASE}/policy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ skuId }),
  });

  console.log(`Status: ${createRes1.status}`);
  const policy1 = await createRes1.json();
  console.log('Response:', JSON.stringify(policy1, null, 2));

  if (createRes1.status === 201 || createRes1.status === 200) {
    console.log(`✅ Policy created successfully\n`);
  } else {
    console.log(`❌ Failed to create policy\n`);
    return;
  }

  // 5. Create policy again (second attempt - should fail with 409)
  console.log('Step 5: Create policy (second attempt - should return 409)');
  const createRes2 = await fetch(`${API_BASE}/policy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ skuId }),
  });

  console.log(`Status: ${createRes2.status}`);
  const response2 = await createRes2.json();
  console.log('Response:', JSON.stringify(response2, null, 2));

  if (createRes2.status === 409) {
    console.log(`✅ Correctly returned 409 Conflict for duplicate policy\n`);
  } else {
    console.log(`❌ Expected 409, got ${createRes2.status}\n`);
  }

  console.log('🎉 Test completed!');
}

main().catch(console.error);
