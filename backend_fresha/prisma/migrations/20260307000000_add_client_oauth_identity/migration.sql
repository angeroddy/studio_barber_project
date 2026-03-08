-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'FACEBOOK');

-- CreateTable
CREATE TABLE "ClientOAuthIdentity" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientOAuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientOAuthIdentity_provider_providerUserId_key" ON "ClientOAuthIdentity"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientOAuthIdentity_clientId_provider_key" ON "ClientOAuthIdentity"("clientId", "provider");

-- CreateIndex
CREATE INDEX "ClientOAuthIdentity_clientId_idx" ON "ClientOAuthIdentity"("clientId");

-- AddForeignKey
ALTER TABLE "ClientOAuthIdentity"
ADD CONSTRAINT "ClientOAuthIdentity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
