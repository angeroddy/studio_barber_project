-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "emailVerificationRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerificationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerificationTokenHash" TEXT,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Client_emailVerificationTokenHash_key" ON "Client"("emailVerificationTokenHash");

-- CreateIndex
CREATE INDEX "Client_emailVerificationTokenExpiresAt_idx" ON "Client"("emailVerificationTokenExpiresAt");
