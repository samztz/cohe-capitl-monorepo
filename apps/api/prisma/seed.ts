/**
 * Database Seed Script
 *
 * Populates the database with initial data for development and testing.
 * Run with: pnpm --filter api seed
 */

import { join } from 'path';

// Dynamically load Prisma Client from custom output directory
const { PrismaClient } = require(join(__dirname, '../generated/prisma/client'));

const prisma = new PrismaClient();

/**
 * Ensure tokenSymbol column exists in Sku table
 */
async function ensureTokenSymbolColumn() {
  try {
    console.log('🔧 Ensuring tokenSymbol column exists...');

    // Add column if not exists
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Sku" ADD COLUMN IF NOT EXISTS "tokenSymbol" TEXT'
    );

    // Set default values for existing rows
    await prisma.$executeRawUnsafe(
      `UPDATE "Sku" SET "tokenSymbol" = 'USDT' WHERE "tokenSymbol" IS NULL`
    );

    // Make column NOT NULL (will fail silently if already NOT NULL)
    try {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "Sku" ALTER COLUMN "tokenSymbol" SET NOT NULL'
      );
    } catch (e) {
      // Column might already be NOT NULL
      console.log('   (tokenSymbol column already has NOT NULL constraint)');
    }

    console.log('✅ tokenSymbol column ready');
  } catch (error) {
    console.error('⚠️  Error ensuring tokenSymbol column:', error);
  }
}

/**
 * Seed database with initial SKU data
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // Ensure tokenSymbol column exists
  await ensureTokenSymbolColumn();

  // Seed SKU 1: YULILY SHIELD INSURANCE (BSC Mainnet)
  const bscMainnetSkuData = {
    name: 'YULILY SHIELD INSURANCE',
    chainId: 56, // BSC Mainnet
    tokenAddress: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC Mainnet
    tokenSymbol: 'USDT',
    termDays: 90,
    premiumAmt: '100.0', // 100 USDT premium
    coverageAmt: '10000.0', // 10,000 USDT coverage
    termsUrl: 'https://example.com/terms/yulily-shield',
    status: 'active',
  };

  const bscMainnetSku = await prisma.sku.upsert({
    where: {
      id: 'bsc-usdt-plan-seed',
    },
    update: bscMainnetSkuData,
    create: {
      id: 'bsc-usdt-plan-seed',
      ...bscMainnetSkuData,
    },
  });

  console.log('✅ Created/Updated SKU (BSC Mainnet):', {
    id: bscMainnetSku.id,
    name: bscMainnetSku.name,
    chainId: bscMainnetSku.chainId,
    tokenSymbol: bscMainnetSku.tokenSymbol,
    status: bscMainnetSku.status,
  });

  // Seed SKU 2: YULILY SHIELD TESTNET (BSC Testnet)
  const bscTestnetSkuData = {
    name: 'YULILY SHIELD TESTNET',
    chainId: 97, // BSC Testnet
    tokenAddress: '0x0', // Native tBNB (not ERC20)
    tokenSymbol: 'tBNB',
    termDays: 90,
    premiumAmt: '100.0', // 100 tBNB premium
    coverageAmt: '10000.0', // 10,000 tBNB coverage
    termsUrl: 'https://example.com/terms/yulily-shield-testnet',
    status: 'active',
  };

  const bscTestnetSku = await prisma.sku.upsert({
    where: {
      id: 'bsc-testnet-usdt-plan-seed',
    },
    update: bscTestnetSkuData,
    create: {
      id: 'bsc-testnet-usdt-plan-seed',
      ...bscTestnetSkuData,
    },
  });

  console.log('✅ Created/Updated SKU (BSC Testnet):', {
    id: bscTestnetSku.id,
    name: bscTestnetSku.name,
    chainId: bscTestnetSku.chainId,
    tokenSymbol: bscTestnetSku.tokenSymbol,
    status: bscTestnetSku.status,
  });

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
