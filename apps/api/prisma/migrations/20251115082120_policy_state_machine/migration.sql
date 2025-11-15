-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('DRAFT', 'PENDING_UNDERWRITING', 'APPROVED_AWAITING_PAYMENT', 'ACTIVE', 'REJECTED', 'EXPIRED_UNPAID', 'EXPIRED');

-- AlterTable: Add paymentDeadline column
ALTER TABLE "Policy" ADD COLUMN     "paymentDeadline" TIMESTAMP(3);

-- AlterTable: Convert status from String to PolicyStatus enum
-- Strategy: Map existing string values to enum values with safe fallback to DRAFT

-- Step 1: Add temporary column with enum type
ALTER TABLE "Policy" ADD COLUMN "status_new" "PolicyStatus";

-- Step 2: Migrate data from string to enum with CASE mapping
UPDATE "Policy" SET "status_new" = CASE
  WHEN "status" = 'pending' THEN 'DRAFT'::"PolicyStatus"
  WHEN "status" = 'under_review' THEN 'PENDING_UNDERWRITING'::"PolicyStatus"
  WHEN "status" = 'approved' THEN 'APPROVED_AWAITING_PAYMENT'::"PolicyStatus"
  WHEN "status" = 'active' THEN 'ACTIVE'::"PolicyStatus"
  WHEN "status" = 'rejected' THEN 'REJECTED'::"PolicyStatus"
  WHEN "status" = 'expired' THEN 'EXPIRED'::"PolicyStatus"
  ELSE 'DRAFT'::"PolicyStatus"  -- Default fallback for unknown values
END;

-- Step 3: Drop old status column
ALTER TABLE "Policy" DROP COLUMN "status";

-- Step 4: Rename new column to status
ALTER TABLE "Policy" RENAME COLUMN "status_new" TO "status";

-- Step 5: Set default value and NOT NULL constraint
ALTER TABLE "Policy" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"PolicyStatus";
ALTER TABLE "Policy" ALTER COLUMN "status" SET NOT NULL;
