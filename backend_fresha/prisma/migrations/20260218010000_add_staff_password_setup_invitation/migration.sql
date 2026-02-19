-- AlterTable
ALTER TABLE "Staff"
ADD COLUMN "passwordSetupRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "passwordSetupTokenHash" TEXT,
ADD COLUMN "passwordSetupTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_passwordSetupTokenHash_key" ON "Staff"("passwordSetupTokenHash");

-- CreateIndex
CREATE INDEX "Staff_passwordSetupTokenExpiresAt_idx" ON "Staff"("passwordSetupTokenExpiresAt");
