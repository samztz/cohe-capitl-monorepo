/**
 * Test script for POST /policy endpoint
 * Tests creation and duplicate prevention
 */

const { Wallet } = require('ethers');
const { SiweMessage } = require('siwe');

const API_BASE = 'http://localhost:3001';
const TEST_WALLET_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function main() {
  console.log('🧪 Testing POST /policy endpoint\n');

  // 1. Create test wallet
  const wallet = new Wallet(TEST_WALLET_PK);
  console.log(`✅ Test wallet: ${wallet.address}\n`);

  // 2. Request nonce
  console.log('Step 1: Request nonce');
  const nonceRes = await fetch(`${API_BASE}/auth/siwe/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: wallet.address }),
  });
  const { nonce } = await nonceRes.json();
  console.log(`✅ Nonce: ${nonce}\n`);

  // 3. Sign SIWE message
  console.log('Step 2: Sign SIWE message');
  const message = `localhost wants you to sign in with your Ethereum account:
${wallet.address}

URI: http://localhost:3001
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

  const signature = await wallet.signMessage(message);
  console.log(`✅ Signature created\n`);

  // 4. Verify and get JWT token
  console.log('Step 3: Verify signature and get JWT');
  const verifyRes = await fetch(`${API_BASE}/auth/siwe/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  });
  const verifyData = await verifyRes.json();
  console.log('Verify response:', verifyData);
  const token = verifyData.token;
  console.log(`✅ JWT token: ${token?.substring(0, 20)}...\n`);

  // 5. Get SKU ID from /products
  console.log('Step 4: Get SKU ID');
  const productsRes = await fetch(`${API_BASE}/products`);
  const products = await productsRes.json();
  const skuId = products[0].id;
  console.log(`✅ SKU ID: ${skuId}\n`);

  // 6. Create policy (first attempt - should succeed)
  console.log('Step 5: Create policy (first attempt)');
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

  // 7. Create policy again (second attempt - should fail with 409)
  console.log('Step 6: Create policy (second attempt - should fail with 409)');
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
