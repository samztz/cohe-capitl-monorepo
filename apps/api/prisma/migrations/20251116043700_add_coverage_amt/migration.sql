-- AlterTable: Add coverageAmt column to Policy table
-- Step 1: Add column as nullable first
ALTER TABLE "Policy" ADD COLUMN "coverageAmt" DECIMAL(38,18);

-- Step 2: Set default values for existing rows based on their SKU
UPDATE "Policy" p
SET "coverageAmt" = s."coverageAmt"
FROM "Sku" s
WHERE p."skuId" = s.id AND p."coverageAmt" IS NULL;

-- Step 3: Make column NOT NULL after setting values
ALTER TABLE "Policy" ALTER COLUMN "coverageAmt" SET NOT NULL;
