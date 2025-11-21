-- CreateTable
CREATE TABLE IF NOT EXISTS "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Setting_key_idx" ON "Setting"("key");
