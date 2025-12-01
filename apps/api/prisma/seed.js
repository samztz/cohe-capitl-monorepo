/**
 * Database Seed Script (JavaScript version for Docker)
 *
 * Populates the database with initial data for development and testing.
 * Run with: node prisma/seed.js
 *
 * Features:
 * - Idempotent: can be run multiple times without duplicating data (uses upsert)
 * - Environment-aware: Demo data only in development, Settings in all environments
 * - Fixed IDs: uses fixed IDs for consistent references
 */

const { join } = require('path');
const fs = require('fs');

// Dynamically load Prisma Client from custom output directory
// Try multiple paths to find the generated client
let PrismaClient, PolicyStatus;

const possiblePaths = [
  join(__dirname, '../generated/prisma'),  // Primary: matches schema.prisma output
  join(__dirname, '../generated/prisma/client'),  // Fallback: legacy path
  join(__dirname, '../dist/generated/prisma'),
  join(__dirname, '../dist/generated/prisma/client'),
  join(process.cwd(), 'generated/prisma'),
  join(process.cwd(), 'generated/prisma/client'),
];

for (const clientPath of possiblePaths) {
  try {
    const client = require(clientPath);
    PrismaClient = client.PrismaClient;
    PolicyStatus = client.PolicyStatus;
    console.log(`✅ Loaded Prisma Client from: ${clientPath}`);
    break;
  } catch (error) {
    // Try next path
  }
}

if (!PrismaClient) {
  console.error('❌ Could not find Prisma Client in any of the expected paths:');
  possiblePaths.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

const prisma = new PrismaClient();

/**
 * Seed Settings (all environments)
 */
async function seedSettings() {
  console.log('⚙️  Seeding Settings...');

  // Treasury address from environment or default to demo address
  const treasuryAddress = process.env.TREASURY_ADDRESS || '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';

  const setting = await prisma.setting.upsert({
    where: { key: 'treasury_address' },
    update: { value: treasuryAddress },
    create: {
      id: 'setting-treasury-address',
      key: 'treasury_address',
      value: treasuryAddress,
    },
  });

  console.log('✅ Setting created/updated:', {
    key: setting.key,
    value: setting.value,
  });
}

/**
 * Seed SKU products (all environments)
 */
async function seedSKUs() {
  console.log('📦 Seeding SKU products...');

  // SKU 1: BSC Mainnet USDT
  const bscMainnetSkuData = {
    name: 'YULILY SHIELD INSURANCE',
    chainId: 56,
    tokenAddress: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC Mainnet
    tokenSymbol: 'USDT',
    termDays: 90,
    premiumAmt: '100.0',
    coverageAmt: '10000.0',
    termsUrl: 'https://example.com/terms/yulily-shield',
    status: 'active',
  };

  const bscMainnetSku = await prisma.sku.upsert({
    where: { id: 'bsc-usdt-plan-seed' },
    update: bscMainnetSkuData,
    create: {
      id: 'bsc-usdt-plan-seed',
      ...bscMainnetSkuData,
    },
  });

  console.log('✅ SKU (BSC Mainnet):', {
    id: bscMainnetSku.id,
    name: bscMainnetSku.name,
    chainId: bscMainnetSku.chainId,
    tokenSymbol: bscMainnetSku.tokenSymbol,
  });

  // SKU 2: BSC Testnet USDT
  const bscTestnetSkuData = {
    name: 'YULILY SHIELD TESTNET',
    chainId: 97,
    tokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // USDT on BSC Testnet
    tokenSymbol: 'tBNB',
    termDays: 90,
    premiumAmt: '100.0',
    coverageAmt: '10000.0',
    termsUrl: 'https://example.com/terms/yulily-shield-testnet',
    status: 'active',
  };

  const bscTestnetSku = await prisma.sku.upsert({
    where: { id: 'bsc-testnet-usdt-plan-seed' },
    update: bscTestnetSkuData,
    create: {
      id: 'bsc-testnet-usdt-plan-seed',
      ...bscTestnetSkuData,
    },
  });

  console.log('✅ SKU (BSC Testnet):', {
    id: bscTestnetSku.id,
    name: bscTestnetSku.name,
    chainId: bscTestnetSku.chainId,
    tokenSymbol: bscTestnetSku.tokenSymbol,
  });

}

/**
 * Seed Demo User and Policies (development only)
 */
async function seedDemoData() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⏭️  Skipping demo data (production environment)');
    return;
  }

  console.log('👤 Seeding demo user and policies...');

  // Demo wallet address (from .env.local.example or hardcoded)
  const demoWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { walletAddress: demoWalletAddress },
    update: {
      roles: ['user'],
      status: 'active',
    },
    create: {
      id: 'demo-user-001',
      walletAddress: demoWalletAddress,
      nonce: 'demo-nonce-' + Date.now(),
      email: 'demo@example.com',
      roles: ['user'],
      status: 'active',
    },
  });

  console.log('✅ Demo User:', {
    id: demoUser.id,
    walletAddress: demoUser.walletAddress,
  });

  // Get SKU for policies
  const testnetSku = await prisma.sku.findUnique({
    where: { id: 'bsc-testnet-usdt-plan-seed' },
  });

  if (!testnetSku) {
    console.warn('⚠️  Testnet SKU not found, skipping demo policies');
    return;
  }

  // Demo Policy 1: PENDING_UNDERWRITING (not signed yet)
  const policy1 = await prisma.policy.upsert({
    where: { id: 'demo-policy-pending' },
    update: {},
    create: {
      id: 'demo-policy-pending',
      userId: demoUser.id,
      skuId: testnetSku.id,
      walletAddress: demoWalletAddress,
      premiumAmt: '100.0',
      coverageAmt: '5000.0',
      status: PolicyStatus.PENDING_UNDERWRITING,
      contractHash: null,
      userSig: null,
    },
  });

  console.log('✅ Demo Policy 1 (Pending):', {
    id: policy1.id,
    status: policy1.status,
  });

  // Demo Policy 2: APPROVED_AWAITING_PAYMENT (signed, approved, has payment deadline)
  const now = new Date();
  const paymentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  const policy2 = await prisma.policy.upsert({
    where: { id: 'demo-policy-approved' },
    update: {
      paymentDeadline: paymentDeadline,
    },
    create: {
      id: 'demo-policy-approved',
      userId: demoUser.id,
      skuId: testnetSku.id,
      walletAddress: demoWalletAddress,
      premiumAmt: '100.0',
      coverageAmt: '8000.0',
      status: PolicyStatus.APPROVED_AWAITING_PAYMENT,
      contractHash: '0x' + 'a'.repeat(64), // Fake contract hash
      userSig: '0x' + 'b'.repeat(130), // Fake signature
      signatureImageUrl: '/uploads/signatures/demo-signature.png',
      signatureHash: 'demo-hash-' + Date.now(),
      signatureSignedAt: new Date(),
      signatureWalletAddress: demoWalletAddress,
      paymentDeadline: paymentDeadline,
      reviewerNote: 'Approved by demo admin - test policy',
    },
  });

  console.log('✅ Demo Policy 2 (Approved):', {
    id: policy2.id,
    status: policy2.status,
    paymentDeadline: policy2.paymentDeadline,
  });

  // Demo Policy 3: ACTIVE (paid, coverage active)
  const startAt = new Date();
  const endAt = new Date(startAt.getTime() + testnetSku.termDays * 24 * 60 * 60 * 1000);

  const policy3 = await prisma.policy.upsert({
    where: { id: 'demo-policy-active' },
    update: {
      startAt: startAt,
      endAt: endAt,
    },
    create: {
      id: 'demo-policy-active',
      userId: demoUser.id,
      skuId: testnetSku.id,
      walletAddress: demoWalletAddress,
      premiumAmt: '100.0',
      coverageAmt: '10000.0',
      status: PolicyStatus.ACTIVE,
      contractHash: '0x' + 'c'.repeat(64),
      userSig: '0x' + 'd'.repeat(130),
      signatureImageUrl: '/uploads/signatures/demo-signature-2.png',
      signatureHash: 'demo-hash-active-' + Date.now(),
      signatureSignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      signatureWalletAddress: demoWalletAddress,
      reviewerNote: 'Approved and activated - test policy',
      startAt: startAt,
      endAt: endAt,
    },
  });

  console.log('✅ Demo Policy 3 (Active):', {
    id: policy3.id,
    status: policy3.status,
    startAt: policy3.startAt,
    endAt: policy3.endAt,
  });

  // Create demo payment for active policy
  const payment = await prisma.payment.upsert({
    where: { txHash: '0xdemo-payment-hash-' + policy3.id },
    update: {},
    create: {
      id: 'demo-payment-001',
      policyId: policy3.id,
      txHash: '0xdemo-payment-hash-' + policy3.id,
      chainId: testnetSku.chainId,
      tokenAddress: testnetSku.tokenAddress,
      fromAddress: demoWalletAddress,
      toAddress: process.env.TREASURY_ADDRESS || '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      amount: '100.0',
      confirmed: true,
    },
  });

  console.log('✅ Demo Payment:', {
    id: payment.id,
    txHash: payment.txHash,
    confirmed: payment.confirmed,
  });
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting database seed...');
  console.log('📍 Environment:', process.env.NODE_ENV || 'development');
  console.log('');

  try {
    // 1. Seed Settings (all environments)
    await seedSettings();
    console.log('');

    // 2. Seed SKUs (all environments)
    await seedSKUs();
    console.log('');

    // 3. Seed Demo Data (development only)
    await seedDemoData();
    console.log('');

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
