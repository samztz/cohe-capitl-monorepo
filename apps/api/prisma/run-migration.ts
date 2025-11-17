const { join } = require('path');
const { PrismaClient } = require(join(__dirname, '../generated/prisma'));

async function runMigration() {
  const prisma = new PrismaClient();

  try {
    console.log('Running tokenSymbol migration...');

    // Step 1: Add column as nullable
    console.log('Step 1: Adding tokenSymbol column...');
    await prisma.$executeRawUnsafe('ALTER TABLE "Sku" ADD COLUMN IF NOT EXISTS "tokenSymbol" TEXT');

    // Step 2: Set default value for existing rows
    console.log('Step 2: Setting default values...');
    await prisma.$executeRawUnsafe(`UPDATE "Sku" SET "tokenSymbol" = 'USDT' WHERE "tokenSymbol" IS NULL`);

    // Step 3: Make column NOT NULL
    console.log('Step 3: Setting NOT NULL constraint...');
    await prisma.$executeRawUnsafe('ALTER TABLE "Sku" ALTER COLUMN "tokenSymbol" SET NOT NULL');

    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
