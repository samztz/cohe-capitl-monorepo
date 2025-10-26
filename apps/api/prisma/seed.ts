/**
 * Database Seed Script
 *
 * Populates the database with initial data for development and testing.
 * Run with: pnpm --filter api seed
 */

import { join } from 'path';

// Dynamically load Prisma Client from custom output directory
const { PrismaClient } = require(join(__dirname, '../generated/prisma'));

const prisma = new PrismaClient();

/**
 * Seed database with initial SKU data
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // Seed SKU: BSC USDT Protection Plan
  const bscSkuData = {
    name: 'BSC USDT Protection Plan',
    chainId: 56, // BSC Mainnet
    tokenAddress: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC
    termDays: 90,
    premiumAmt: '100.0', // 100 USDT premium
    coverageAmt: '10000.0', // 10,000 USDT coverage
    termsUrl: 'https://example.com/terms/bsc-usdt-protection',
    status: 'active',
  };

  const bscSku = await prisma.sku.upsert({
    where: {
      // Use a composite unique constraint or create one based on name
      // For now, we'll check if it exists by fetching first
      id: 'bsc-usdt-plan-seed', // Temporary ID for upsert demo
    },
    update: bscSkuData,
    create: {
      id: 'bsc-usdt-plan-seed',
      ...bscSkuData,
    },
  });

  console.log('✅ Created/Updated SKU:', {
    id: bscSku.id,
    name: bscSku.name,
    chainId: bscSku.chainId,
    status: bscSku.status,
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
