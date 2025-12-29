/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referralCredits" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "referralStats" JSONB NOT NULL DEFAULT '{"count": 0, "credited": 0, "lastCreditedAt": null}',
ADD COLUMN     "referrerUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referrerUserId_idx" ON "User"("referrerUserId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
