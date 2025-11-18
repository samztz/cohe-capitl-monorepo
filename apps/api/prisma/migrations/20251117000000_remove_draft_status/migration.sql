-- Migration: Remove DRAFT status from PolicyStatus enum
-- Step 1: Update all DRAFT policies to PENDING_UNDERWRITING
UPDATE "Policy"
SET status = 'PENDING_UNDERWRITING'
WHERE status = 'DRAFT';

-- Step 2: Remove DRAFT from enum (Postgres will handle this)
-- Create new enum without DRAFT
CREATE TYPE "PolicyStatus_new" AS ENUM ('PENDING_UNDERWRITING', 'APPROVED_AWAITING_PAYMENT', 'ACTIVE', 'REJECTED', 'EXPIRED_UNPAID', 'EXPIRED');

-- Update the Policy table to use new enum
ALTER TABLE "Policy"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PolicyStatus_new" USING ("status"::text::"PolicyStatus_new"),
  ALTER COLUMN "status" SET DEFAULT 'PENDING_UNDERWRITING'::"PolicyStatus_new";

-- Drop old enum
DROP TYPE "PolicyStatus";

-- Rename new enum to original name
ALTER TYPE "PolicyStatus_new" RENAME TO "PolicyStatus";
