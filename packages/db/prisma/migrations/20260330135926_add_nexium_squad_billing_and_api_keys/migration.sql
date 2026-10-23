/*
  Warnings:

  - A unique constraint covering the columns `[uploadToken]` on the table `NexiumSquad` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `NexiumSquad` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "NexiumSquad" ADD COLUMN     "storageQuotaMB" INTEGER,
ADD COLUMN     "storageUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "uploadToken" TEXT;

-- CreateTable
CREATE TABLE "NexiumSquadSubscription" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NexiumSquadSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NexiumSquadApiKey" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NexiumSquadApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NexiumSquadSubscription_stripeSubscriptionId_key" ON "NexiumSquadSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "NexiumSquadSubscription_squadId_idx" ON "NexiumSquadSubscription"("squadId");

-- CreateIndex
CREATE INDEX "NexiumSquadSubscription_productId_idx" ON "NexiumSquadSubscription"("productId");

-- CreateIndex
CREATE INDEX "NexiumSquadSubscription_status_currentPeriodEnd_idx" ON "NexiumSquadSubscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "NexiumSquadApiKey_keyHash_key" ON "NexiumSquadApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "NexiumSquadApiKey_squadId_idx" ON "NexiumSquadApiKey"("squadId");

-- CreateIndex
CREATE INDEX "NexiumSquadApiKey_keyHash_idx" ON "NexiumSquadApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "NexiumSquad_uploadToken_key" ON "NexiumSquad"("uploadToken");

-- CreateIndex
CREATE UNIQUE INDEX "NexiumSquad_stripeCustomerId_key" ON "NexiumSquad"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "NexiumSquadSubscription" ADD CONSTRAINT "NexiumSquadSubscription_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "NexiumSquad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumSquadSubscription" ADD CONSTRAINT "NexiumSquadSubscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumSquadApiKey" ADD CONSTRAINT "NexiumSquadApiKey_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "NexiumSquad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
