-- AlterTable: Remove unique constraint on Policy(walletAddress, skuId)
-- This allows users to purchase multiple policies for the same product

-- Drop the unique constraint
ALTER TABLE "Policy" DROP CONSTRAINT IF EXISTS "Policy_walletAddress_skuId_key";

-- Create a non-unique index for efficient queries (replacing the unique constraint)
CREATE INDEX IF NOT EXISTS "Policy_walletAddress_skuId_idx" ON "Policy"("walletAddress", "skuId");
