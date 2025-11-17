-- AlterTable: Add tokenSymbol column to Sku table
-- Step 1: Add column as nullable
ALTER TABLE "Sku" ADD COLUMN "tokenSymbol" TEXT;

-- Step 2: Set default value for existing rows (USDT for BSC mainnet)
UPDATE "Sku" SET "tokenSymbol" = 'USDT' WHERE "tokenSymbol" IS NULL;

-- Step 3: Make column NOT NULL
ALTER TABLE "Sku" ALTER COLUMN "tokenSymbol" SET NOT NULL;
