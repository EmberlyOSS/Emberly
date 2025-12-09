/*
  Warnings:

  - You are about to drop the column `verificationToken` on the `CustomDomain` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CustomDomain" DROP COLUMN "verificationToken",
ADD COLUMN     "cfBackoffCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cfPauseUntil" TIMESTAMP(3);
