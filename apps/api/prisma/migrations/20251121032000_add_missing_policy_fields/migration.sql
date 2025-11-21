-- Migration: Add missing Policy fields (reviewerNote and signature metadata)
-- These fields were in schema.prisma but never added to database

-- Step 1: Add reviewerNote field (Admin note when approving/rejecting)
ALTER TABLE "Policy" ADD COLUMN "reviewerNote" TEXT;

-- Step 2: Add signature metadata fields (handwritten signature tracking)
ALTER TABLE "Policy" ADD COLUMN "signatureImageUrl" TEXT;
ALTER TABLE "Policy" ADD COLUMN "signatureHash" TEXT;
ALTER TABLE "Policy" ADD COLUMN "signatureSignedAt" TIMESTAMP(3);
ALTER TABLE "Policy" ADD COLUMN "signatureIp" TEXT;
ALTER TABLE "Policy" ADD COLUMN "signatureUserAgent" TEXT;
ALTER TABLE "Policy" ADD COLUMN "signatureWalletAddress" TEXT;

-- Step 3: Remove incorrect UNIQUE INDEX on (walletAddress, skuId)
-- Schema.prisma only defines this as a non-unique index
-- The original migration created a UNIQUE INDEX, which we need to drop
DROP INDEX IF EXISTS "Policy_walletAddress_skuId_key";

-- Note: Non-unique index "Policy_walletAddress_skuId_idx" already exists from previous migration
