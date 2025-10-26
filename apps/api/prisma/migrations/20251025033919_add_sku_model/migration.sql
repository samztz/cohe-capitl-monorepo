-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "termDays" INTEGER NOT NULL DEFAULT 90,
    "premiumAmt" DECIMAL(38,18) NOT NULL,
    "coverageAmt" DECIMAL(38,18) NOT NULL,
    "termsUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sku_status_idx" ON "Sku"("status");

-- CreateIndex
CREATE INDEX "Sku_chainId_idx" ON "Sku"("chainId");
