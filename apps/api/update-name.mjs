import { PrismaClient } from './generated/prisma/client.js';

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

  console.log(`✅ Updated ${result.count} product(s)`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
