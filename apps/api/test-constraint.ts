/**
 * Test script to check database constraints
 */
import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkConstraints() {
  console.log('Checking database constraints...\n');

  // Raw SQL to check constraints on Policy table
  const constraints = await prisma.$queryRaw`
    SELECT
      conname AS constraint_name,
      contype AS constraint_type,
      pg_get_constraintdef(oid) AS constraint_definition
    FROM pg_constraint
    WHERE conrelid = 'Policy'::regclass;
  `;

  console.log('Constraints on Policy table:');
  console.log(JSON.stringify(constraints, null, 2));
  console.log('\n');

  // Check indexes
  const indexes = await prisma.$queryRaw`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'Policy';
  `;

  console.log('Indexes on Policy table:');
  console.log(JSON.stringify(indexes, null, 2));

  await prisma.$disconnect();
}

checkConstraints().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
