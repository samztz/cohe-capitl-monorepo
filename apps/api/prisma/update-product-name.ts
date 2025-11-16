/**
 * Update existing product name from "BSC USDT Protection Plan" to "YULILY SHIELD INSURANCE"
 */

import { join } from 'path';

// Dynamically load Prisma Client from custom output directory
const { PrismaClient } = require(join(__dirname, '../generated/prisma'));

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating product name...');

  const result = await prisma.sku.updateMany({
    where: {
      name: 'BSC USDT Protection Plan',
    },
    data: {
      name: 'YULILY SHIELD INSURANCE',
    },
  });

  console.log(`✅ Updated ${result.count} product(s) to "YULILY SHIELD INSURANCE"`);
}

main()
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
