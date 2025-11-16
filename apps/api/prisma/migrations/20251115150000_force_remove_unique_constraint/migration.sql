-- Force remove unique constraint on Policy(walletAddress, skuId)
-- This migration forcefully drops the constraint even if previous migration failed

-- Drop ALL unique constraints on walletAddress and skuId (try different possible constraint names)
DO $$
BEGIN
    -- Try the expected constraint name
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Policy_walletAddress_skuId_key') THEN
        ALTER TABLE "Policy" DROP CONSTRAINT "Policy_walletAddress_skuId_key";
        RAISE NOTICE 'Dropped constraint: Policy_walletAddress_skuId_key';
    END IF;

    -- Try alternative constraint name
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policy_walletaddress_skuid_key') THEN
        ALTER TABLE "Policy" DROP CONSTRAINT "policy_walletaddress_skuid_key";
        RAISE NOTICE 'Dropped constraint: policy_walletaddress_skuid_key';
    END IF;
END $$;

-- Ensure the non-unique index exists
CREATE INDEX IF NOT EXISTS "Policy_walletAddress_skuId_idx" ON "Policy"("walletAddress", "skuId");
